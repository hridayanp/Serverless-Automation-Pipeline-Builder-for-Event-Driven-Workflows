// handler.js
import * as projectController from './src/controllers/projectController.js';
import * as taskController from './src/controllers/taskController.js';
import { verifyToken } from './src/utils/authMiddleware.js';
import { CustomResponse } from './src/utils/response.js';

// ------------------------------------------------------------------
// Common wrapper for authenticated routes
// ------------------------------------------------------------------
const withAuth = (fn) => async (event) => {
  const authResult = await verifyToken(event);

  if (!authResult.isAuthorized) {
    // authResult already contains { statusCode, body }
    return authResult;
  }

  // Pass the verified user info to the controller
  const authedEvent = authResult.event;

  try {
    return await fn(authedEvent);
  } catch (err) {
    console.error('Controller Error:', err);
    const response = new CustomResponse();
    response.status = 'FAILURE';
    response.message = 'Internal server error';
    return { statusCode: 500, body: JSON.stringify(response) };
  }
};

// ------------------------------------------------------------------
// Project routes
// ------------------------------------------------------------------
export const createProject = withAuth(projectController.createProject);
export const getProjects = withAuth(projectController.getProjects);
export const createEnvironment = withAuth(projectController.createEnvironment);
export const getEnvironments = withAuth(projectController.getEnvironments);

// ------------------------------------------------------------------
// Task routes (new S3-enabled task controller)
// ------------------------------------------------------------------
export const createTask = withAuth(taskController.createTask);
export const getTasks = withAuth(taskController.getTasks);
export const executeTask = withAuth(taskController.executeTask);
export const getTaskLogFile = withAuth(taskController.getTaskLogFile);
export const getTaskScriptFiles = withAuth(taskController.getTaskScriptFiles);
