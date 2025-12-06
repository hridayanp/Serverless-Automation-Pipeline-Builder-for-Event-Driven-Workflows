// src/controllers/taskController.js
import * as taskService from '../services/task/taskService.js';
import { CustomResponse } from '../utils/response.js';

// Common CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

// ----------------------------------------------------------------------------
// 1. CREATE TASK  (Stores Base64 file + Base64 requirements in DynamoDB)
// ----------------------------------------------------------------------------
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
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(response),
      };
    }

    // DIRECTLY pass Base64 (no decoding here)
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

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('createTask Error:', err);

    response.status = 'FAILURE';
    response.message = err.message ?? 'Failed to create task';

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};

// ----------------------------------------------------------------------------
// 2. GET TASK(S)
// ----------------------------------------------------------------------------
export const getTasks = async (event) => {
  const response = new CustomResponse();
  try {
    const qs = event.queryStringParameters || {};
    const project_id = qs.project_id;
    const task_id = qs.task_id;

    let data;
    if (task_id) {
      const t = await taskService.getTaskById(task_id);
      data = taskService.serializeTask(t);
    } else {
      const tasks = await taskService.getAllTasks(project_id);
      data = tasks.map((t) => taskService.serializeTask(t));
    }

    response.status = 'SUCCESS';
    response.message = 'Tasks fetched';
    response.data = data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('getTasks Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to fetch tasks';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};

// ----------------------------------------------------------------------------
// 3. EXECUTE TASK
// ----------------------------------------------------------------------------
export const executeTask = async (event) => {
  const response = new CustomResponse();
  try {
    const { taskId } = event.pathParameters || {};
    if (!taskId) {
      response.status = 'FAILURE';
      response.message = 'Missing taskId in path';
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(response),
      };
    }

    // 1) Download base64 → /tmp for execution
    await taskService.prepareFilesForExecution(taskId);

    // 2) Execute task
    const result = await taskService.executeTask(taskId);

    response.status = 'SUCCESS';
    response.message = 'Task execution completed';
    response.data = result;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('executeTask Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to execute task';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};

// ----------------------------------------------------------------------------
// 4. NEW ENDPOINT — GET TASK LOG FILE (Base64 from DynamoDB)
// ----------------------------------------------------------------------------
export const getTaskLogFile = async (event) => {
  const response = new CustomResponse();
  try {
    const { taskId } = event.pathParameters || {};

    if (!taskId) {
      response.status = 'FAILURE';
      response.message = 'Missing taskId in path';
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(response),
      };
    }

    const logBase64 = await taskService.getTaskLogFile(taskId);

    response.status = 'SUCCESS';
    response.message = 'Task log file retrieved';
    response.data = {
      task_id: taskId,
      log_base64: logBase64,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('getTaskLogFile Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to retrieve task log file';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};

// ----------------------------------------------------------------------------
// 5. NEW ENDPOINT — GET PYTHON SCRIPT FOLDER (Base64 from DynamoDB)
// ----------------------------------------------------------------------------
export const getTaskScriptFiles = async (event) => {
  const response = new CustomResponse();
  try {
    const { taskId } = event.pathParameters || {};

    if (!taskId) {
      response.status = 'FAILURE';
      response.message = 'Missing taskId';
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(response),
      };
    }

    const files = await taskService.getTaskFiles(taskId);

    response.status = 'SUCCESS';
    response.message = 'Task script files retrieved';
    response.data = files; // { file_data_base64, requirements_base64 }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('getTaskScriptFiles Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to retrieve script files';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};
