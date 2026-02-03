'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SchedulerTaskNode from './Nodes/SchedulerTaskNode';
import SchedulerTriggerNode from './Nodes/SchedulerTriggerNode';
import SchedulerForm from '@/components/Forms/WorkflowManager/SchedulerForm';
import { useSchedulerGraph } from './hooks/useSchedulerGraph';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { selectAllTasks, setTasks } from '@/redux/slices/workflowSlice';
import { validatePayload } from '@/utils/validations';
import { createWorkflows } from '@/api/ApiService';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
import { transformTasksToOptions } from '@/utils/transformFunctions';

const nodeTypes: any = {
  task: SchedulerTaskNode,
  trigger: SchedulerTriggerNode,
};

const config = {
  enforceSingleChildPerTask: false, // true = only one child for any task
  enforceSingleChildPerTrigger: false, // true = only one child per trigger type
};

export default function SchedulerFlow() {
  const allTasks = useSelector(selectAllTasks);

  const taskOptions = transformTasksToOptions(allTasks, ['id', 'name']);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { projects } = useSelector((state: any) => state.workflow);

  const [isLoading, setIsLoading] = useState(false);

  const [workflowName, setWorkflowName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [envId, setEnvId] = useState('');

  const [cron, setCron] = useState('1 * * * *');
  const [cronDetail, setCronDetail] = useState('');
  const [payload, setPayload] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    nodeId: null,
  });

  const {
    nodes,
    edges,
    setEdges,
    onNodesChange,
    onEdgesChange,
    handleAddTask,
    deleteNodeAndChildren,
    injectDeleteHandler,
  } = useSchedulerGraph(taskOptions);

  const requestDelete = useCallback((nodeId: any) => {
    setDeleteDialog({ open: true, nodeId });
  }, []);

  const enhancedNodes = injectDeleteHandler(requestDelete);

  const createWorkflowPayload = async () => {
    const buildTree = (nodeId: string): any => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.type !== 'task') return null;

      const buckets: Record<string, any[]> = {};
      let totalChildren = 0;

      edges
        .filter((e) => e.source === nodeId)
        .forEach((edge) => {
          const triggerNode = nodes.find(
            (n) => n.id === edge.target && n.type === 'trigger'
          );
          if (!triggerNode || triggerNode.data.selectedTrigger === undefined)
            return;

          const label = (
            triggerNode.data.triggerOptions.find(
              (o: any) => o.value === triggerNode.data.selectedTrigger
            )?.label ?? 'unknown'
          )
            .toLowerCase()
            .replace(/\s+/g, '_');

          const childEdges = edges.filter((e2) => e2.source === triggerNode.id);

          // If enforcing single child per trigger
          if (config.enforceSingleChildPerTrigger && childEdges.length > 1) {
            throw new Error(
              `Trigger "${label}" for task "${
                node.data.label || node.id
              }" has too many children. Only one is allowed.`
            );
          }

          childEdges.forEach((e2) => {
            const child = nodes.find(
              (n) => n.id === e2.target && n.type === 'task'
            );
            if (!child) return;

            totalChildren += 1;
            if (config.enforceSingleChildPerTask && totalChildren > 1) {
              throw new Error(
                `Task "${
                  node.data.label || node.id
                }" has too many children. Only one child is allowed.`
              );
            }

            const subtree = buildTree(child.id);
            buckets[label] = buckets[label] || [];
            buckets[label].push(subtree);
          });
        });

      const result: any = {
        task_id: node.data.selectedTaskId || null,
        identifier: node.data.exit_identifier || '',
        description: node.data.exit_description || '',
      };

      if (Object.keys(buckets).length) {
        result.children = buckets;
      }

      return result;
    };

    const root = nodes.find((n) => n.type === 'task');
    if (!root) {
      toast.error('Create a root task first.');
      return;
    }

    let tasks;
    try {
      tasks = buildTree(root.id);
    } catch (e: any) {
      toast.error(e.message);
      return;
    }

    const payload = {
      project_id: Number(projectId),
      environment_id: Number(envId),
      workflow_name: workflowName,
      scheduler_detail: { cron, detail: cronDetail },
      tasks,
    };

    const requiredFields = [
      'project_id',
      'environment_id',
      'workflow_name',
      'scheduler_detail',
    ];

    const missing = validatePayload(payload, requiredFields);

    if (missing.length > 0) {
      toast.error(`Missing required field(s): ${missing.join(', ')}`);
      return;
    }

    setPayload(payload);
    setIsLoading(true);

    try {
      const res = await createWorkflows(payload);

      if (res?.status === 201 && res.data.status === 'success') {
        toast.success('Workflow created successfully!');
        navigate('/workflow/details');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch (e) {
      console.error('Error creating workflow:', e);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }

    dispatch(setTasks([]));
  };

  return (
    <Card className="h-full border-none shadow-none p-0">
      <CardContent className="grid gap-6 h-full p-0">
        <SchedulerForm
          workflowName={workflowName}
          setWorkflowName={setWorkflowName}
          projectId={projectId}
          setProjectId={setProjectId}
          cron={cron}
          setCron={setCron}
          cronDetail={cronDetail}
          setCronDetail={setCronDetail}
          projects={projects as any}
          envId={envId}
          setEnvId={setEnvId}
        />

        {/* Graph */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-semibold">Tasks</h2>
            {nodes.length === 0 && (
              <Button
                onClick={() => handleAddTask(undefined)}
                variant="outline"
              >
                Add Task
              </Button>
            )}
          </div>
          <div className="h-[90vh] rounded-md overflow-hidden border">
            <ReactFlow
              nodes={enhancedNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={(params: any) =>
                setEdges((eds: any) =>
                  addEdge(
                    {
                      ...params,
                      type: 'straight',
                      markerEnd: {
                        width: 20,
                        height: 20,
                        color: '#2A2A2A',
                        type: MarkerType.Arrow,
                      },
                      style: {
                        stroke: '#2A2A2A',
                        strokeWidth: 2.5,
                        strokeDasharray: '5 2',
                      },
                      animated: true,
                    },
                    eds
                  )
                )
              }
              nodeTypes={nodeTypes}
              fitView
              defaultViewport={{ x: 0, y: 0, zoom: 0.3 }}
              attributionPosition="bottom-left"
            >
              <Controls />
              <MiniMap />
              <Background gap={12} size={1} />
            </ReactFlow>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={createWorkflowPayload}
            className="w-[15%] mt-2 flex justify-center items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <ReloadIcon className="h-4 w-4 animate-spin" />
            ) : (
              'Create Workflow'
            )}
          </Button>
        </div>

        {/* Payload Preview */}
        {payload && (
          <div>
            <h2 className="text-sm font-medium mb-2 text-muted-foreground">
              Payload Preview
            </h2>
            <pre className="bg-muted rounded-md p-4 text-lg overflow-x-auto max-h-80">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, nodeId: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Deleting this node will also delete any connected children.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, nodeId: null })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteDialog.nodeId)
                    deleteNodeAndChildren(deleteDialog.nodeId);
                  setDeleteDialog({ open: false, nodeId: null });
                }}
              >
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
