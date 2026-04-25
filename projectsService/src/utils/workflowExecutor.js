import * as taskService from '../services/task/taskService.js';
import { updateItem } from '../services/aws/dynamoService.js';

/**
 * Workflow Executor Handler
 * Recursively executes tasks in a workflow and tracks their status.
 */
export const handler = async (event) => {
  // Support both direct invocation and SNS/EventBridge formats if needed
  const data = event.detail || event;
  const { workflow, runId } = data;

  if (!workflow || !runId) {
    console.error('Invalid workflow executor payload:', data);
    return;
  }

  try {
    await runNode(workflow.tasks, runId);

    await updateWorkflowStatus(runId, 'COMPLETED');
  } catch (err) {
    console.error('Workflow Executor Error:', err);
    await updateWorkflowStatus(runId, 'FAILED');
  }
};

/**
 * Recursively runs task nodes based on outcomes
 */
const runNode = async (node, runId) => {
  if (!node || !node.task_id) return;

  // executeTask handles logging to WorkflowTaskLogsTable when runId is provided
  const result = await taskService.executeTask(node.task_id, runId);

  // Determine the next node based on outcome
  const outcome = result.success ? 'on_success' : 'on_failure';
  let nextNode = node.children?.[outcome];

  // Fallback to on_completion if specific outcome branch doesn't exist
  if (!nextNode && node.children?.['on_completion']) {
    nextNode = node.children['on_completion'];
  }

  if (nextNode) {
    // If it's an array of children (parallel execution is not yet supported in this simple recursion, 
    // but we can loop through them if needed. For now, assuming single node or object)
    if (Array.isArray(nextNode)) {
      for (const child of nextNode) {
        await runNode(child, runId);
      }
    } else {
      await runNode(nextNode, runId);
    }
  }
};

/**
 * Updates the overall workflow run status
 */
const updateWorkflowStatus = async (runId, status) => {
  await updateItem(
    process.env.TABLE_WORKFLOW_LOGS,
    { run_id: runId },
    'SET #s = :s, end_date = :e',
    {
      ':s': status,
      ':e': new Date().toISOString(),
    },
    { '#s': 'status' }
  );
};
