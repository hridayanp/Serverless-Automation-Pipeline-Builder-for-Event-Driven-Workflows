// src/services/taskService.js
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import {
  putItem,
  getItem,
  scanTable,
  updateItem,
} from '../dynamo/dynamoService.js';

const TABLE = process.env.TABLE_TASKS; // tasks-table-${sls:stage}
const BASE_TMP = '/tmp';

// Create task record and create folder structure on disk (under /tmp)
export const createTask = async ({
  name,
  description,
  project_id,
  environment_id,
  file_data, // { file_name, file_content (base64) }
  requirements, // { file_name, file_content (base64) }
  script_folder_name,
  log_file_name,
}) => {
  const taskId = uuidv4();

  // Prepare file paths under /tmp/<project_script_folder>/<script_folder_name>
  const projectFolder = project_id; // reuse project id as base folder name
  const targetDir = path.join(
    BASE_TMP,
    projectFolder,
    script_folder_name || ''
  );
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // write files if present
  let filePath = null;
  let requirementsPath = null;

  if (file_data && file_data.file_content && file_data.file_name) {
    const decoded = Buffer.from(file_data.file_content, 'base64').toString(
      'utf-8'
    );
    filePath = path.join(targetDir, file_data.file_name);
    fs.writeFileSync(filePath, decoded, { encoding: 'utf8' });
  }

  if (requirements && requirements.file_content && requirements.file_name) {
    const decodedReq = Buffer.from(
      requirements.file_content,
      'base64'
    ).toString('utf-8');
    requirementsPath = path.join(targetDir, requirements.file_name);
    fs.writeFileSync(requirementsPath, decodedReq, { encoding: 'utf8' });
  }

  const now = new Date().toISOString();

  const item = {
    id: taskId,
    name: name || '',
    description: description || '',
    project_id,
    environment_id,
    file_info: {
      file_name: file_data?.file_name || null,
      path: filePath || null,
    },
    requirement_info: {
      file_name: requirements?.file_name || null,
      path: requirementsPath || null,
    },
    task_unique_id: uuidv4(),
    status: 'IN_PROGRESS', // initial
    log_file_name: log_file_name || null,
    created_at: now,
    updated_at: now,
    script_folder: script_folder_name || '',
  };

  await putItem(TABLE, item);
  return item;
};

// Get single task by id
export const getTaskById = async (taskId) => {
  const task = await getItem(TABLE, { id: taskId });
  return task || null;
};

// Get all tasks (optionally filter by project_id)
export const getAllTasks = async (projectId = null) => {
  const all = await scanTable(TABLE);
  if (!projectId) return all;
  return all.filter((t) => t.project_id === projectId);
};

// Serialize single task for API responses (base64 file content)
export const serializeTask = (task) => {
  if (!task) return null;

  const fileData = (() => {
    try {
      if (
        task.file_info &&
        task.file_info.path &&
        fs.existsSync(task.file_info.path)
      ) {
        const bytes = fs.readFileSync(task.file_info.path);
        return {
          file_name: task.file_info.file_name,
          file_content: Buffer.from(bytes).toString('base64'),
        };
      }
      return {
        file_name: task.file_info?.file_name || null,
        file_content: null,
      };
    } catch (e) {
      return {
        file_name: task.file_info?.file_name || null,
        file_content: null,
      };
    }
  })();

  const reqData = (() => {
    try {
      if (
        task.requirement_info &&
        task.requirement_info.path &&
        fs.existsSync(task.requirement_info.path)
      ) {
        const bytes = fs.readFileSync(task.requirement_info.path);
        return {
          file_name: task.requirement_info.file_name,
          file_content: Buffer.from(bytes).toString('base64'),
        };
      }
      return {
        file_name: task.requirement_info?.file_name || null,
        file_content: null,
      };
    } catch (e) {
      return {
        file_name: task.requirement_info?.file_name || null,
        file_content: null,
      };
    }
  })();

  return {
    id: task.id,
    name: task.name,
    description: task.description,
    file_data: fileData,
    requirements: reqData,
    status: task.status,
    project_id: task.project_id,
    environment_id: task.environment_id,
    created_at: task.created_at,
    updated_at: task.updated_at,
    log_file_name: task.log_file_name,
  };
};

// Update task status in DynamoDB
export const updateTaskStatus = async (taskId, status) => {
  const updateExpression = 'SET #s = :s, updated_at = :u';
  const expressionValues = { ':s': status, ':u': new Date().toISOString() };
  const expressionNames = { '#s': 'status' };

  const updated = await updateItem(
    TABLE,
    { id: taskId },
    updateExpression,
    expressionValues,
    expressionNames
  );
  return updated;
};

/**
 * execTaskRequirements for Lambda (Option A: Python layer).
 *
 * NOTE: Under Option A we assume a Python Layer pre-installs dependencies.
 * We therefore DO NOT attempt to run `pip install`. This function only:
 *  - verifies the requirements file exists
 *  - logs the info
 *  - updates status to CREATED (meaning requirements are considered available)
 *
 * If you later add a mechanism to install requirements (e.g., custom image),
 * adapt this function.
 */
export const execTaskRequirements = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const reqPath = task?.requirement_info?.path;
  if (!reqPath || !fs.existsSync(reqPath)) {
    await updateTaskStatus(taskId, 'REQUIREMENTS_INSTALLATION_FAILED');
    throw new Error(`Requirements file not found: ${reqPath}`);
  }

  // With Python Layer pre-installed, we skip pip install here.
  // Mark requirements as available/created.
  await updateTaskStatus(taskId, 'CREATED');
  return true;
};

/**
 * executeTask: runs the task script using the Lambda runtime's python interpreter.
 * Writes logs to /tmp/task-logs/<taskId>.log and updates DynamoDB status.
 */
export const executeTask = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const scriptPath = task?.file_info?.path;
  if (!scriptPath || !fs.existsSync(scriptPath)) {
    await updateTaskStatus(taskId, 'FAILED');
    throw new Error(`Script file not found: ${scriptPath}`);
  }

  const logDir = path.join(BASE_TMP, 'task-logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `${taskId}.log`);

  // Update status -> RUNNING
  await updateTaskStatus(taskId, 'RUNNING');

  // Run python3 script. Using spawnSync to capture output synchronously inside Lambda.
  // We rely on the Lambda environment (and your Python Layer) to provide the python3 executable / packages.
  const spawnArgs = [scriptPath];

  const execOptions = {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024, // 10 MB
  };

  try {
    // Use spawnSync for synchronous invocation
    const result = spawnSync('python3', spawnArgs, execOptions);

    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const outLog = [
      `=== STDOUT ===\n${stdout}\n`,
      `=== STDERR ===\n${stderr}\n`,
      `exitCode: ${result.status}\n`,
    ].join('\n');

    fs.writeFileSync(logFile, outLog, { encoding: 'utf8' });

    if (result.status !== 0) {
      await updateTaskStatus(taskId, 'FAILED');
      return {
        success: false,
        exitCode: result.status,
        logFile,
        stdout,
        stderr,
      };
    }

    await updateTaskStatus(taskId, 'COMPLETED');
    return {
      success: true,
      exitCode: 0,
      logFile,
      stdout,
      stderr,
    };
  } catch (err) {
    fs.appendFileSync(logFile, `Execution error: ${String(err)}\n`);
    await updateTaskStatus(taskId, 'FAILED');
    throw err;
  }
};
