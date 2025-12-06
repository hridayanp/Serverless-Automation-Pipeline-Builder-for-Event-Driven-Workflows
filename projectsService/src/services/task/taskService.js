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

const TABLE = process.env.TABLE_TASKS;
const BASE_TMP = '/tmp';

/* ============================================================
   CREATE TASK — store file_data.file_content + requirements.file_content as BASE64
   ============================================================ */
export const createTask = async ({
  name,
  description,
  project_id,
  environment_id,
  file_data, // { file_name, file_content: BASE64 }
  requirements, // { file_name, file_content: BASE64 }
  script_folder_name,
  log_file_name,
}) => {
  const taskId = uuidv4();
  const now = new Date().toISOString();

  const item = {
    id: taskId,
    name: name || '',
    description: description || '',
    project_id,
    environment_id,

    // Store EXACT payload
    file_data: file_data || null,
    requirements: requirements || null,

    status: 'IN_PROGRESS',
    task_unique_id: uuidv4(),

    log_file_name: log_file_name || 'task.log',
    log_file_base64: null,

    script_folder: script_folder_name || '',

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
   serializeTask — returns EXACT payload shape
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

    file_data: task.file_data || null,
    requirements: task.requirements || null,

    log_file_name: task.log_file_name,
    log_file_base64: task.log_file_base64 || null,

    created_at: task.created_at,
    updated_at: task.updated_at,
  };
};

/* ============================================================
   Update status helper
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
    { '#s': 'status' }
  );
};

/* ============================================================
   execTaskRequirements — nothing installs here
   ============================================================ */
export const execTaskRequirements = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  if (!task.requirements || !task.requirements.file_content) {
    await updateTaskStatus(taskId, 'REQUIREMENTS_INSTALLATION_FAILED');
    throw new Error('Missing requirements file');
  }

  await updateTaskStatus(taskId, 'CREATED');
  return true;
};

/* ============================================================
   EXECUTE TASK — decode base64 → write script → run python
   ============================================================ */
export const executeTask = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  if (!task.file_data || !task.file_data.file_content) {
    await updateTaskStatus(taskId, 'FAILED');
    throw new Error('Missing script file');
  }

  const scriptDir = path.join(BASE_TMP, 'task-run', taskId);
  if (!fs.existsSync(scriptDir)) fs.mkdirSync(scriptDir, { recursive: true });

  const scriptPath = path.join(
    scriptDir,
    task.file_data.file_name || 'script.py'
  );

  // Decode BASE64 → actual python script
  fs.writeFileSync(
    scriptPath,
    Buffer.from(task.file_data.file_content, 'base64').toString('utf8')
  );

  await updateTaskStatus(taskId, 'RUNNING');

  const result = spawnSync('python3', [scriptPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const fullLog = `=== STDOUT ===\n${stdout}\n\n=== STDERR ===\n${stderr}\nexitCode: ${result.status}`;

  // Save log as BASE64
  await updateItem(
    TABLE,
    { id: taskId },
    'SET log_file_base64 = :l, updated_at = :u',
    {
      ':l': Buffer.from(fullLog).toString('base64'),
      ':u': new Date().toISOString(),
    }
  );

  if (result.status !== 0) {
    await updateTaskStatus(taskId, 'FAILED');
    return { success: false, exitCode: result.status };
  }

  await updateTaskStatus(taskId, 'COMPLETED');
  return { success: true, exitCode: 0 };
};

/* ============================================================
   GET LOGS — return log_file_base64 as is
   ============================================================ */
export const getTaskLogs = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  return {
    taskId,
    log_file_name: task.log_file_name,
    log_file_base64: task.log_file_base64 || null,
  };
};
