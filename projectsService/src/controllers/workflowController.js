import * as workflowService from '../services/workflow/workflowService.js';
import { CustomResponse } from '../utils/response.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

/* ----------------------------------
   CREATE WORKFLOW
   POST /workflows
---------------------------------- */
export const createWorkflow = async (event) => {
  const response = new CustomResponse();

  try {
    const body = JSON.parse(event.body || '{}');

    const workflow = await workflowService.createWorkflow(body);

    response.status = 'SUCCESS';
    response.message = 'Workflow created successfully';
    response.data = { id: workflow.id };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    response.status = 'FAILURE';
    response.message = err.message || 'Workflow creation failed';

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};

/* ----------------------------------
   GET WORKFLOWS
   GET /workflows?project_id=&workflow_id=
---------------------------------- */
export const getWorkflows = async (event) => {
  const response = new CustomResponse();
  const { project_id, workflow_id } = event.queryStringParameters || {};

  try {
    let data;

    if (workflow_id) {
      data = await workflowService.getWorkflowById(workflow_id);
    } else if (project_id) {
      data = await workflowService.getWorkflows(project_id);
    } else {
      throw new Error('Either project_id or workflow_id must be provided');
    }

    response.status = 'SUCCESS';
    response.data = data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    response.status = 'FAILURE';
    response.message = err.message || 'Workflow fetch failed';

    return {
      statusCode: err.message?.includes('must be provided') ? 400 : 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};

/* ----------------------------------
   EXECUTE WORKFLOW
   POST /workflows/execute/{workflow_id}
---------------------------------- */
export const executeWorkflow = async (event) => {
  const response = new CustomResponse();
  const { workflow_id } = event.pathParameters || {};

  try {
    if (!workflow_id) {
      throw new Error('workflow_id is required');
    }

    const result = await workflowService.executeWorkflow(workflow_id);

    response.status = 'SUCCESS';
    response.message = 'Workflow execution started';
    response.data = result; // { runId }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    response.status = 'FAILURE';
    response.message = err.message || 'Workflow execution failed';

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify(response),
    };
  }
};

/* ----------------------------------
   FETCH WORKFLOW LOGS
   POST /workflows/logs
---------------------------------- */
export const fetchWorkflowLogs = async (event) => {
  const response = new CustomResponse();

  try {
    const body = JSON.parse(event.body || '{}');

    if (!body.workflow_id) {
      throw new Error('workflow_id is required');
    }

    const logs = await workflowService.fetchLogs(body);

    response.status = 'SUCCESS';
    response.data = logs;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    response.status = 'FAILURE';
    response.message = err.message || 'Failed to fetch workflow logs';

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify(response),
    };
  }
};
