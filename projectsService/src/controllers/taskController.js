// src/controllers/taskController.js
import * as taskService from '../services/task/taskService.js';
import { CustomResponse } from '../utils/response.js';

// Common CORS headers (same pattern as your controllers)
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

export const createTask = async (event) => {
  const response = new CustomResponse();
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    const {
      name,
      description,
      project_id,
      environment_id,
      file_data,
      requirements,
      script_folder_name,
      log_file_name,
    } = body;

    // Basic validation
    if (!project_id || !environment_id) {
      response.status = 'FAILURE';
      response.message = 'Missing project_id or environment_id';
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(response),
      };
    }

    // create task record and write files to /tmp
    const task = await taskService.createTask({
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
    response.data = task;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('createTask Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to create task';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};

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

// Execute task on demand (POST /tasks/{taskId}/execute)
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

    // Ensure requirements are available (this will mark CREATED)
    await taskService.execTaskRequirements(taskId);

    // Now execute the task script
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
