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
} from '../aws/dynamoService.js';

import { putFile, getFile } from '../aws/s3Service.js';

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
    { '#s': 'status' }
  );
};

/* ============================================================
   EXECUTE TASK — download script from S3 & run locally
   ============================================================ */
export const executeTask = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  if (!task.file_data_s3_key) {
    await updateTaskStatus(taskId, 'FAILED');
    throw new Error('Missing script file');
  }

  // Create temporary directory
  const scriptDir = path.join(BASE_TMP, 'task-run', taskId);
  fs.mkdirSync(scriptDir, { recursive: true });

  const scriptPath = path.join(scriptDir, 'script.py');

  // Download script from S3
  const fileObj = await getFile(BUCKET, task.file_data_s3_key);
  fs.writeFileSync(scriptPath, fileObj.buffer.toString());

  await updateTaskStatus(taskId, 'RUNNING');

  // Execute the script
  const result = spawnSync('python3', [scriptPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const exitCode = result.status;

  const fullLog = `=== STDOUT ===\n${stdout}\n\n=== STDERR ===\n${stderr}\nexitCode: ${exitCode}`;

  // Upload logs to S3
  const logKey = `tasks/${taskId}/${task.log_file_name}`;
  await putFile(BUCKET, logKey, Buffer.from(fullLog, 'utf8'), 'text/plain');

  // Update task log key
  await updateItem(
    TABLE,
    { id: taskId },
    'SET log_file_s3_key = :k, updated_at = :u',
    {
      ':k': logKey,
      ':u': new Date().toISOString(),
    }
  );

  if (exitCode !== 0) {
    await updateTaskStatus(taskId, 'FAILED');
    return { success: false, exitCode };
  }

  await updateTaskStatus(taskId, 'COMPLETED');
  return { success: true, exitCode: 0 };
};

/* ============================================================
   RETRIEVE LOG FILE FROM S3 (Base64)
   ============================================================ */
export const getTaskLogs = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task?.log_file_s3_key) throw new Error('Logs not found');

  const fileObj = await getFile(BUCKET, task.log_file_s3_key);

  return {
    taskId,
    log_file_name: task.log_file_name,
    log_file_base64: fileObj.base64,
  };
};
