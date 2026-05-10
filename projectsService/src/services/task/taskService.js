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
  deleteItem,
} from '../aws/dynamoService.js';
import * as workflowService from '../workflow/workflowService.js';

import { putFile, getFile } from '../aws/s3Service.js';
import { invokeSync } from '../aws/lambdaService.js';

const TABLE = process.env.TABLE_TASKS;
const BUCKET = process.env.BUCKET_TASK_FILES;
const BASE_TMP = '/tmp';

/* ============================================================
   CREATE TASK — store Base64 files in S3
   ============================================================ */
export const createTask = async ({
  name,
  description,
  project_id,
  environment_id,
  file_data,
  requirements,
  script_folder_name,
  log_file_name,
}) => {
  // --- Validation ---
  if (!project_id || !environment_id) {
    throw new Error('project_id and environment_id are required');
  }

  // Ensure Project exists
  const project = await getItem(process.env.TABLE_PROJECTS, { id: project_id });
  if (!project) throw new Error('Project not found');

  // Ensure Environment exists and belongs to the project
  const allEnvs = await scanTable(process.env.TABLE_PROJECT_ENVS);
  const env = allEnvs.find(
    (e) => e.id === environment_id && e.project_id === project_id,
  );
  if (!env)
    throw new Error('Environment not found or does not belong to this project');

  const taskId = uuidv4();
  const now = new Date().toISOString();

  let file_data_s3_key = null;
  let requirements_s3_key = null;

  /* ---------------------------
      Upload script file to S3
     --------------------------- */
  if (file_data?.file_content) {
    const buffer = Buffer.from(file_data.file_content, 'base64');
    file_data_s3_key = `tasks/${taskId}/${file_data.file_name}`;

    await putFile(BUCKET, file_data_s3_key, buffer, 'text/plain');
  }

  /* ---------------------------
      Upload requirements to S3
     --------------------------- */
  if (requirements?.file_content) {
    const buffer = Buffer.from(requirements.file_content, 'base64');
    requirements_s3_key = `tasks/${taskId}/${requirements.file_name}`;

    await putFile(BUCKET, requirements_s3_key, buffer, 'text/plain');
  }

  /* ---------------------------
      Insert into DynamoDB
     --------------------------- */
  const item = {
    id: taskId,
    name: name || '',
    description: description || '',
    project_id,
    environment_id,

    file_data_s3_key,
    requirements_s3_key,

    status: 'IN_PROGRESS',
    task_unique_id: uuidv4(),

    log_file_name: log_file_name || 'task.log',
    log_file_s3_key: null,

    script_folder_name: script_folder_name || '',

    created_at: now,
    updated_at: now,
  };

  await putItem(TABLE, item);
  return item;
};

/* ============================================================
   GET TASK
   ============================================================ */
export const getTaskById = async (taskId) => {
  return (await getItem(TABLE, { id: taskId })) || null;
};

/* ============================================================
   GET ALL TASKS
   ============================================================ */
export const getAllTasks = async (projectId = null) => {
  const all = await scanTable(TABLE);
  if (!projectId) return all;
  return all.filter((t) => t.project_id === projectId);
};

/* ============================================================
   serializeTask — only returns metadata + S3 keys
   ============================================================ */
export const serializeTask = (task) => {
  if (!task) return null;

  return {
    id: task.id,
    name: task.name,
    description: task.description,
    project_id: task.project_id,
    environment_id: task.environment_id,
    status: task.status,

    file_data_s3_key: task.file_data_s3_key || null,
    requirements_s3_key: task.requirements_s3_key || null,

    log_file_name: task.log_file_name,
    log_file_s3_key: task.log_file_s3_key || null,

    created_at: task.created_at,
    updated_at: task.updated_at,
  };
};

/* ============================================================
   GET SCRIPT FILE FROM S3 (Base64 output)
   ============================================================ */
export const getTaskScriptFile = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task?.file_data_s3_key) throw new Error('Script not found');

  const data = await getFile(BUCKET, task.file_data_s3_key);

  return {
    file_name: path.basename(task.file_data_s3_key),
    file_content_base64: data.base64,
  };
};

/* ============================================================
   GET REQUIREMENTS FILE FROM S3 (Base64)
   ============================================================ */
export const getTaskRequirementsFile = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task?.requirements_s3_key) throw new Error('Requirements not found');

  const data = await getFile(BUCKET, task.requirements_s3_key);

  return {
    file_name: path.basename(task.requirements_s3_key),
    file_content_base64: data.base64,
  };
};

/* ============================================================
   UPDATE TASK STATUS
   ============================================================ */
export const updateTaskStatus = async (taskId, status) => {
  return await updateItem(
    TABLE,
    { id: taskId },
    'SET #s = :s, updated_at = :u',
    {
      ':s': status,
      ':u': new Date().toISOString(),
    },
    { '#s': 'status' },
  );
};

/* ============================================================
   Helper: Install Dependencies
   ============================================================ */
const installDependencies = (scriptDir, requirementsPath) => {
  if (!fs.existsSync(requirementsPath)) return '';

  try {
    const installDir = path.join(scriptDir, 'libs');
    if (!fs.existsSync(installDir)) {
      fs.mkdirSync(installDir, { recursive: true });
    }

    // Attempt to install dependencies into /tmp/libs
    const result = spawnSync(
      'python3',
      ['-m', 'pip', 'install', '-r', requirementsPath, '-t', installDir],
      {
        encoding: 'utf8',
        timeout: 300000, // 5 minutes max for pip install
      },
    );

    return `=== DEPENDENCY INSTALLATION ===\n${
      result.stdout || ''
    }\n${result.stderr || ''}\nExit Code: ${result.status}\n\n`;
  } catch (err) {
    return `=== DEPENDENCY INSTALLATION FAILED ===\n${err.message}\n\n`;
  }
};

/* ============================================================
   EXECUTE TASK — download script from S3 & run locally
   ============================================================ */
export const executeTask = async (taskId, runId = null) => {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const WORKFLOW_TASK_LOGS = process.env.TABLE_WORKFLOW_TASK_LOGS;

  const updateStatus = async (status) => {
    if (runId) {
      let updateExpression = 'SET #s = :s, updated_at = :u';
      const expressionValues = {
        ':s': status,
        ':u': new Date().toISOString(),
      };
      const expressionNames = { '#s': 'status' };

      if (status === 'RUNNING') {
        updateExpression += ', start_date = :sd';
        expressionValues[':sd'] = new Date().toISOString();
      } else if (status === 'COMPLETED' || status === 'FAILED') {
        updateExpression += ', end_date = :ed';
        expressionValues[':ed'] = new Date().toISOString();
      }

      await updateItem(
        WORKFLOW_TASK_LOGS,
        { run_id: runId, task_id: taskId },
        updateExpression,
        expressionValues,
        expressionNames,
      );
    } else {
      await updateTaskStatus(taskId, status);
    }
  };

  if (!task.file_data_s3_key) {
    await updateStatus('FAILED');
    throw new Error('Missing script file');
  }

  try {
    await updateStatus('RUNNING');

    // 1. Prepare Environment Requirements
    let envReqContent = null;
    if (task.environment_id) {
      const env = await getItem(process.env.TABLE_PROJECT_ENVS, {
        id: task.environment_id,
      });
      if (env && env.file_content) {
        envReqContent = env.file_content; // Already Base64 from DB/Upload
      }
    }

    // 2. Invoke the Python Task Runner
    const runnerFunctionName = `projectService-${process.env.STAGE || 'dev'}-pythonTaskRunner`;
    
    const runnerPayload = {
      taskId,
      runId: runId || 'standalone',
      s3Key: task.file_data_s3_key,
      reqKey: task.requirements_s3_key,
      envReqContent
    };

    console.log(`Invoking Python Runner: ${runnerFunctionName}`);
    const result = await invokeSync(runnerFunctionName, runnerPayload);
    
    if (!result || result.success === undefined) {
      throw new Error('Invalid response from Python Runner');
    }

    if (!result.success) {
      await updateStatus('FAILED');
      return { 
        success: false, 
        exitCode: result.exitCode || 1, 
        duration: result.duration || 0 
      };
    }

    await updateStatus('COMPLETED');
    return { 
      success: true, 
      exitCode: 0, 
      duration: result.duration || 0 
    };
  } catch (err) {
    console.error('Task Execution Error:', err);
    await updateStatus('FAILED');
    throw err;
  }
};

/* ============================================================
   DELETE TASKS BY PROJECT (CASCADE)
   ============================================================ */
export const deleteTasksByProject = async (projectId) => {
  const tasks = await getAllTasks(projectId);
  if (tasks.length > 0) {
    await Promise.all(tasks.map((t) => deleteItem(TABLE, { id: t.id })));
  }
};

/* ============================================================
   RETRIEVE LOG FILE FROM S3 (Base64)
   ============================================================ */
export const getTaskLogs = async (taskId, logKey = null) => {
  const task = await getTaskById(taskId);
  const s3Key = logKey || task?.log_file_s3_key;

  if (!s3Key) throw new Error('Logs not found');

  const fileObj = await getFile(BUCKET, s3Key);

  return {
    taskId,
    log_file_name: task.log_file_name,
    log_file_base64: fileObj.base64,
  };
};
/* ============================================================
   DELETE TASK (With Dependency Check)
   ============================================================ */
export const deleteTask = async (taskId) => {
  const task = await getItem(TABLE, { id: taskId });
  if (!task) throw new Error('Task not found');

  const isInWorkflow = await workflowService.isTaskInWorkflows(taskId);
  if (isInWorkflow) {
    throw new Error('Task is already used in a workflow and cannot be deleted');
  }

  await deleteItem(TABLE, { id: taskId });
  return { id: taskId, message: 'Task deleted successfully' };
};
