// src/controllers/taskController.js
import * as taskService from '../services/task/taskService.js';
import { CustomResponse } from '../utils/response.js';

// Common CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

/* ============================================================================
   1. CREATE TASK
   - Stores script + requirements Base64 in S3 via taskService
   ========================================================================= */
export const createTask = async (event) => {
  const response = new CustomResponse();

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    const {
      name,
      description,
      project_id,
      environment_id,
      file_data, // { file_name, file_content(base64) }
      requirements, // { file_name, file_content(base64) }
      script_folder_name,
      log_file_name,
    } = body;

    if (!project_id || !environment_id) {
      response.status = 'FAILURE';
      response.message = 'Missing project_id or environment_id';
      return { statusCode: 400, headers, body: JSON.stringify(response) };
    }

    const newTask = await taskService.createTask({
      name,
      description,
      project_id,
      environment_id,
      file_data,
      requirements,
      script_folder_name,
      log_file_name,
    });

    response.status = 'SUCCESS';
    response.message = 'Task created';
    response.data = newTask;

    return { statusCode: 201, headers, body: JSON.stringify(response) };
  } catch (err) {
    console.error('createTask Error:', err);
    response.status = 'FAILURE';
    response.message = err.message ?? 'Failed to create task';
    return { statusCode: 500, headers, body: JSON.stringify(response) };
  }
};

/* ============================================================================
   2. GET TASK(S)
   ========================================================================= */
export const getTasks = async (event) => {
  const response = new CustomResponse();
  try {
    const qs = event.queryStringParameters || {};
    const { project_id, task_id } = qs;

    let data;
    if (task_id) {
      const task = await taskService.getTaskById(task_id);
      data = taskService.serializeTask(task);
    } else {
      const tasks = await taskService.getAllTasks(project_id);
      data = tasks.map(taskService.serializeTask);
    }

    response.status = 'SUCCESS';
    response.message = 'Tasks fetched';
    response.data = data;

    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    console.error('getTasks Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to fetch tasks';
    return { statusCode: 500, headers, body: JSON.stringify(response) };
  }
};

/* ============================================================================
   3. EXECUTE TASK
   - Downloads script from S3 and executes locally
   ========================================================================= */
export const executeTask = async (event) => {
  const response = new CustomResponse();
  try {
    const { taskId } = event.pathParameters || {};
    if (!taskId) {
      response.status = 'FAILURE';
      response.message = 'Missing taskId in path';
      return { statusCode: 400, headers, body: JSON.stringify(response) };
    }

    const result = await taskService.executeTask(taskId);

    response.status = 'SUCCESS';
    response.message = 'Task executed successfully';
    response.data = result;

    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    console.error('executeTask Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to execute task';
    return { statusCode: 500, headers, body: JSON.stringify(response) };
  }
};

/* ============================================================================
   4. GET TASK LOG FILE
   - Retrieves log from S3 as Base64
   ========================================================================= */
export const getTaskLogFile = async (event) => {
  const response = new CustomResponse();
  try {
    const { taskId } = event.pathParameters || {};
    if (!taskId) {
      response.status = 'FAILURE';
      response.message = 'Missing taskId';
      return { statusCode: 400, headers, body: JSON.stringify(response) };
    }

    const logData = await taskService.getTaskLogs(taskId);

    response.status = 'SUCCESS';
    response.message = 'Task log retrieved';
    response.data = logData;

    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    console.error('getTaskLogFile Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to retrieve task log';
    return { statusCode: 500, headers, body: JSON.stringify(response) };
  }
};

/* ============================================================================
   5. GET SCRIPT + REQUIREMENTS FILES
   - Downloads Base64 from S3
   ========================================================================= */
export const getTaskScriptFiles = async (event) => {
  const response = new CustomResponse();
  try {
    const { taskId } = event.pathParameters || {};
    if (!taskId) {
      response.status = 'FAILURE';
      response.message = 'Missing taskId';
      return { statusCode: 400, headers, body: JSON.stringify(response) };
    }

    const script = await taskService.getTaskScriptFile(taskId);
    const requirements = await taskService.getTaskRequirementsFile(taskId);

    response.status = 'SUCCESS';
    response.message = 'Task script and requirements retrieved';
    response.data = { script, requirements };

    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    console.error('getTaskScriptFiles Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to retrieve script files';
    return { statusCode: 500, headers, body: JSON.stringify(response) };
  }
};
