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

  const executionPath = [];

  try {
    // Initial update to ensure the execution_path field exists
    await updateItem(process.env.TABLE_WORKFLOW_LOGS, { run_id: runId }, 'SET execution_path = :empty', {
      ':empty': [],
    });

    await runNode(workflow.tasks, runId, executionPath);

    await updateWorkflowStatus(runId, 'COMPLETED');
  } catch (err) {
    console.error('Workflow Executor Error:', err);
    await updateWorkflowStatus(runId, 'FAILED');
  }
};

/**
 * Recursively runs task nodes based on outcomes
 */
const runNode = async (node, runId, executionPath) => {
  if (!node || !node.task_id) return;

  // executeTask handles logging to WorkflowTaskLogsTable when runId is provided
  const result = await taskService.executeTask(node.task_id, runId);

  const step = {
    task_id: node.task_id,
    success: result.success,
    duration: result.duration || 0,
    timestamp: new Date().toISOString(),
  };

  // Determine the next node based on outcome
  const outcome = result.success ? 'on_success' : 'on_failure';
  let nextNode = node.children?.[outcome];
  let branchTaken = outcome;

  // Fallback to on_completion if specific outcome branch doesn't exist
  if (!nextNode && node.children?.['on_completion']) {
    nextNode = node.children['on_completion'];
    branchTaken = 'on_completion';
  }

  step.branch_taken = nextNode ? branchTaken : 'FINISH';
  executionPath.push(step);

  // Incremental update of the execution path for real-time visibility
  await appendToExecutionPath(runId, step);

  if (nextNode) {
    if (Array.isArray(nextNode)) {
      for (const child of nextNode) {
        await runNode(child, runId, executionPath);
      }
    } else {
      await runNode(nextNode, runId, executionPath);
    }
  }
};

/**
 * Appends a step to the execution_path in DynamoDB
 */
const appendToExecutionPath = async (runId, step) => {
  await updateItem(
    process.env.TABLE_WORKFLOW_LOGS,
    { run_id: runId },
    'SET execution_path = list_append(execution_path, :step)',
    {
      ':step': [step],
    },
  );
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
    { '#s': 'status' },
  );
};
