import * as workflowService from '../services/workflow/workflowService.js';
import { CustomResponse } from '../utils/response.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

export const createWorkflow = async (event) => {
  const response = new CustomResponse();

  try {
    const body = JSON.parse(event.body);
    const workflow = await workflowService.createWorkflow(body);

    response.status = 'SUCCESS';
    response.message = 'Workflow created successfully';
    response.data = { id: workflow.id };

    return { statusCode: 201, headers, body: JSON.stringify(response) };
  } catch (err) {
    response.status = 'FAILURE';
    response.message = err.message;
    return { statusCode: 500, headers, body: JSON.stringify(response) };
  }
};

export const getWorkflows = async (event) => {
  const { project_id, workflow_id } = event.queryStringParameters || {};
  const response = new CustomResponse();

  try {
    const data = workflow_id
      ? await workflowService.getWorkflowById(workflow_id)
      : await workflowService.getWorkflows(project_id);

    response.status = 'SUCCESS';
    response.data = data;
    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    response.status = 'FAILURE';
    response.message = err.message;
    return { statusCode: 500, headers, body: JSON.stringify(response) };
  }
};

export const executeWorkflow = async (event) => {
  const { workflowId } = event.pathParameters;
  const response = new CustomResponse();

  try {
    await workflowService.executeWorkflow(workflowId);
    response.status = 'SUCCESS';
    response.message = 'Workflow execution started';
    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    response.status = 'FAILURE';
    response.message = err.message;
    return { statusCode: 400, headers, body: JSON.stringify(response) };
  }
};

export const fetchWorkflowLogs = async (event) => {
  const response = new CustomResponse();
  const body = JSON.parse(event.body);

  try {
    const logs = await workflowService.fetchLogs(body);
    response.status = 'SUCCESS';
    response.data = logs;
    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    response.status = 'FAILURE';
    response.message = err.message;
    return { statusCode: 400, headers, body: JSON.stringify(response) };
  }
};
