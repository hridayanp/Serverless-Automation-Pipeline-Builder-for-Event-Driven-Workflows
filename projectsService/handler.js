// handler.js
import * as projectController from './src/controllers/projectController.js';
import { verifyToken } from './src/utils/authMiddleware.js';
import { CustomResponse } from './src/utils/response.js';
import * as taskController from './src/controllers/taskController.js';

// Common wrapper for routes that require authentication
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

export const createProject = withAuth(projectController.createProject);
export const getProjects = withAuth(projectController.getProjects);
export const createEnvironment = withAuth(projectController.createEnvironment);
export const getEnvironments = withAuth(projectController.getEnvironments);

export const createTask = withAuth(taskController.createTask);
export const getTasks = withAuth(taskController.getTasks);
export const executeTask = withAuth(taskController.executeTask);

/**
 * endpoints:
  POST - https://nvce0p0qwa.execute-api.ap-south-1.amazonaws.com/project
  GET - https://nvce0p0qwa.execute-api.ap-south-1.amazonaws.com/project
  POST - https://nvce0p0qwa.execute-api.ap-south-1.amazonaws.com/project/environment
  GET - https://nvce0p0qwa.execute-api.ap-south-1.amazonaws.com/project/environment/{projectId}
 */
