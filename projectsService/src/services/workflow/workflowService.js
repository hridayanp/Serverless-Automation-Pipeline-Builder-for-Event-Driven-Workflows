import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, scanTable } from '../aws/dynamoService.js';
import { invokeLambda } from '../aws/lambdaService.js';

const WORKFLOW_TABLE = process.env.TABLE_WORKFLOWS;
const WORKFLOW_LOGS = process.env.TABLE_WORKFLOW_LOGS;
const TASK_LOGS = process.env.TABLE_WORKFLOW_TASK_LOGS;

export const createWorkflow = async (workflow) => {
  const id = uuidv4();

  const item = {
    id,
    workflow_name: workflow.workflow_name,
    scheduler_detail: workflow.scheduler_detail,
    tasks: ensureNodeIds(workflow.tasks),
    project_id: workflow.project_id,
    environment_id: workflow.environment_id,
    created_at: new Date().toISOString(),
  };

  await putItem(WORKFLOW_TABLE, item);
  return item;
};

export const getWorkflowById = async (id) => {
  const workflow = await getItem(WORKFLOW_TABLE, { id });
  return serializeWorkflow(workflow);
};

export const getWorkflows = async (projectId) => {
  const workflows = await scanTable(WORKFLOW_TABLE);
  return workflows
    .filter((w) => w.project_id === projectId)
    .map(serializeWorkflow);
};

export const executeWorkflow = async (workflowId) => {
  const workflow = await getItem(WORKFLOW_TABLE, { id: workflowId });
  if (!workflow) throw new Error('Workflow not found');

  const runId = uuidv4();

  await putItem(WORKFLOW_LOGS, {
    run_id: runId,
    workflow_id: workflowId,
    status: 'EXECUTING',
    start_date: new Date().toISOString(),
  });

  // async fire-and-forget
  await invokeLambda('workflowExecutor', {
    workflow,
    runId,
  });
};

export const fetchLogs = async ({ workflow_id }) => {
  const logs = await scanTable(WORKFLOW_LOGS);
  return logs.filter((l) => l.workflow_id === workflow_id);
};

/* ---------------- HELPERS ---------------- */

const ensureNodeIds = (task) => {
  if (!task.node_id) task.node_id = uuidv4();
  Object.values(task.children || {})
    .flat()
    .forEach(ensureNodeIds);
  return task;
};

export const serializeWorkflow = (workflow) => ({
  id: workflow.id,
  workflow_name: workflow.workflow_name,
  scheduler_detail: workflow.scheduler_detail,
  tasks: workflow.tasks,
});
