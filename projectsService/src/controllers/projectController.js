// src/controllers/projectController.js
import * as projectService from '../services/projectService.js';
import { CustomResponse } from '../utils/response.js';

// ✅ Common CORS headers (for all Lambda responses)
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

// ✅ Helper: safe JSON parser
const safeParseJSON = (body) => {
  try {
    return body ? JSON.parse(body) : {};
  } catch (err) {
    return {};
  }
};

// -------------------- CREATE PROJECT --------------------
export const createProject = async (event) => {
  const response = new CustomResponse();

  try {
    const body = safeParseJSON(event.body);
    const project = await projectService.createProject(body);

    response.status = 'SUCCESS';
    response.message = 'Project created successfully';
    response.data = project;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('createProject Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to create project';
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify(response),
    };
  }
};

// -------------------- GET PROJECTS --------------------
export const getProjects = async (event) => {
  const response = new CustomResponse();

  try {
    const query = event.queryStringParameters || {};
    const project_id = query.project_id;

    let data;
    if (project_id) {
      data = await projectService.getProjectById(project_id);
    } else {
      data = await projectService.getAllProjects();
    }

    response.status = 'SUCCESS';
    response.message = 'Projects fetched successfully';
    response.data = data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('getProjects Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to fetch projects';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};

// -------------------- CREATE ENVIRONMENT --------------------
export const createEnvironment = async (event) => {
  const response = new CustomResponse();

  try {
    const body = safeParseJSON(event.body);
    const env = await projectService.createProjectEnvironment(body);

    response.status = 'SUCCESS';
    response.message = 'Environment creation in progress';
    response.data = env;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('createEnvironment Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to create environment';
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify(response),
    };
  }
};

// -------------------- GET ENVIRONMENTS --------------------
export const getEnvironments = async (event) => {
  const response = new CustomResponse();

  try {
    const { projectId } = event.pathParameters || {};
    if (!projectId) {
      response.status = 'FAILURE';
      response.message = 'Missing projectId in path parameters';
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(response),
      };
    }

    const envs = await projectService.getProjectEnvironments(projectId);

    response.status = 'SUCCESS';
    response.message = 'Environments fetched successfully';
    response.data = envs;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('getEnvironments Error:', err);
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to fetch environments';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};
