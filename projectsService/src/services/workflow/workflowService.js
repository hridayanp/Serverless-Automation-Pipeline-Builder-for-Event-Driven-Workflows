import { v4 as uuidv4 } from 'uuid';
import {
  putItem,
  getItem,
  scanTable,
  updateItem,
} from '../aws/dynamoService.js';
import { runPythonScript } from '../utils/scriptRunner.js';

const WORKFLOW_TABLE = process.env.TABLE_WORKFLOWS;
const WORKFLOW_LOGS = process.env.TABLE_WORKFLOW_LOGS;
const TASK_LOGS = process.env.TABLE_WORKFLOW_TASK_LOGS;

/* --------------------------------------------------
   CREATE WORKFLOW
-------------------------------------------------- */
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

/* --------------------------------------------------
   GET WORKFLOWS
-------------------------------------------------- */
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

/* --------------------------------------------------
   EXECUTE WORKFLOW (ENTRY POINT)
-------------------------------------------------- */
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

  try {
    await runWorkflowNode(workflow.tasks, workflow.environment_id, runId);

    await updateItem(
      WORKFLOW_LOGS,
      { run_id: runId },
      'SET #status = :s, end_date = :e',
      {
        ':s': 'COMPLETED',
        ':e': new Date().toISOString(),
      },
      { '#status': 'status' }
    );
  } catch (err) {
    await updateItem(
      WORKFLOW_LOGS,
      { run_id: runId },
      'SET #status = :s, end_date = :e',
      {
        ':s': 'FAILED',
        ':e': new Date().toISOString(),
      },
      { '#status': 'status' }
    );
    throw err;
  }

  return { runId };
};

/* --------------------------------------------------
   RECURSIVE WORKFLOW EXECUTION (CORE)
-------------------------------------------------- */
const runWorkflowNode = async (taskNode, environmentId, runId) => {
  const taskId = taskNode.task_id;

  const taskLogId = uuidv4();
  await putItem(TASK_LOGS, {
    id: taskLogId,
    run_id: runId,
    task_id: taskId,
    status: 'IN_PROGRESS',
    start_date: new Date().toISOString(),
  });

  const exitCode = await runPythonScript({ taskId, environmentId });
  const outcome = mapExitCodeToOutcome(exitCode);

  await updateItem(
    TASK_LOGS,
    { id: taskLogId },
    'SET #status = :s, end_date = :e',
    {
      ':s': outcome,
      ':e': new Date().toISOString(),
    },
    { '#status': 'status' }
  );

  const children = taskNode.children || {};
  const nextNode = children[outcome];

  if (nextNode) {
    await runWorkflowNode(nextNode, environmentId, runId);
  }
};

/* --------------------------------------------------
   FETCH LOGS
-------------------------------------------------- */
export const fetchLogs = async ({ workflow_id }) => {
  const workflowLogs = await scanTable(WORKFLOW_LOGS);
  const taskLogs = await scanTable(TASK_LOGS);
  const workflows = await scanTable(WORKFLOW_TABLE);
  const tasks = await scanTable(process.env.TABLE_TASKS);
  const projects = await scanTable(process.env.TABLE_PROJECTS);

  const runs = workflowLogs.filter((l) => l.workflow_id === workflow_id);

  return runs.map((run) => {
    const workflow = workflows.find((w) => w.id === run.workflow_id);
    const project = projects.find((p) => p.id === workflow.project_id);

    const runTaskLogs = taskLogs
      .filter((t) => t.run_id === run.run_id)
      .map((tl) => {
        const task = tasks.find((t) => t.id === tl.task_id);
        return {
          task_name: task?.name,
          start_date: tl.start_date,
          end_date: tl.end_date,
          status: tl.status,
        };
      });

    return {
      run_id: run.run_id,
      workflow_id: run.workflow_id,
      project_name: project?.name,
      workflow_status: run.status,
      start_date: run.start_date,
      end_date: run.end_date,
      task_logs: runTaskLogs,
    };
  });
};

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */
const ensureNodeIds = (task) => {
  if (!task.node_id) task.node_id = uuidv4();

  const children = task.children || {};
  for (const key of Object.keys(children)) {
    const child = children[key];
    if (Array.isArray(child)) {
      child.forEach(ensureNodeIds);
    } else if (typeof child === 'object') {
      ensureNodeIds(child);
    }
  }
  return task;
};

const mapExitCodeToOutcome = (code) => {
  if (code === 0) return 'on_completion';
  if (code === 1) return 'on_failure';
  if (code === 2) return 'on_success';
  return 'unknown';
};

export const serializeWorkflow = (workflow) => ({
  id: workflow.id,
  workflow_name: workflow.workflow_name,
  scheduler_detail: workflow.scheduler_detail,
  tasks: workflow.tasks,
});

export const scheduledWorkflowRunner = async (event) => {
  const { workflow_id } = event.detail;
  await executeWorkflow(workflow_id);
};
