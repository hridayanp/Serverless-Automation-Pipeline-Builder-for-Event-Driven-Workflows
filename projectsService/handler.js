// handler.js
import * as projectController from './src/controllers/projectController.js';
import * as taskController from './src/controllers/taskController.js';
import * as workflowController from './src/controllers/workflowController.js'; // ✅ NEW
import { verifyToken } from './src/utils/authMiddleware.js';
import { CustomResponse } from './src/utils/response.js';

// ------------------------------------------------------------------
// Common wrapper for authenticated routes
// ------------------------------------------------------------------
const withAuth = (fn) => async (event) => {
  const authResult = await verifyToken(event);

  if (!authResult.isAuthorized) {
    return authResult;
  }

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
// Task routes
// ------------------------------------------------------------------
export const createTask = withAuth(taskController.createTask);
export const getTasks = withAuth(taskController.getTasks);
export const executeTask = withAuth(taskController.executeTask);
export const getTaskLogFile = withAuth(taskController.getTaskLogFile);
export const getTaskScriptFiles = withAuth(taskController.getTaskScriptFiles);

// ------------------------------------------------------------------
// ✅ Workflow routes (NEW)
// ------------------------------------------------------------------
export const createWorkflow = withAuth(workflowController.createWorkflow);
export const getWorkflows = withAuth(workflowController.getWorkflows);
export const executeWorkflow = withAuth(workflowController.executeWorkflow);
export const fetchWorkflowLogs = withAuth(workflowController.fetchWorkflowLogs);
