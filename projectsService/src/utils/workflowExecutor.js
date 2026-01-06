import * as taskService from '../services/task/taskService.js';
import { putItem, updateItem } from '../services/aws/dynamoService.js';

export const handler = async (event) => {
  const { workflow, runId } = event;

  await runNode(workflow.tasks, workflow, runId);
};

const runNode = async (node, workflow, runId) => {
  const result = await taskService.executeTask(node.task_id);

  await putItem(process.env.TABLE_WORKFLOW_TASK_LOGS, {
    run_id: runId,
    task_id: node.task_id,
    status: result.success ? 'SUCCESS' : 'FAILED',
    timestamp: new Date().toISOString(),
  });

  const next = node.children?.[result.success ? 'on_success' : 'on_failure'];
  if (next) await runNode(next, workflow, runId);
};
