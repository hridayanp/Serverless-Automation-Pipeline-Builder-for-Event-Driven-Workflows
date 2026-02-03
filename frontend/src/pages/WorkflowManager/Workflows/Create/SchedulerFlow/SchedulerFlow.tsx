/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { dummyProjects, dummyTaskOptions, triggerOptions } from '@/utils/dummy';
import SchedulerTaskNode from './Nodes/SchedulerTaskNode';
import SchedulerTriggerNode from './Nodes/SchedulerTriggerNode';

let nodeIdCounter = 1;
const NODE_WIDTH = 300;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 100;

export default function SchedulerFlow() {
  const [workflowName, setWorkflowName] = useState<any>('');
  const [projectId, setProjectId] = useState<any>('1');
  const [cron, setCron] = useState<any>('1 * * * *');
  const [cronDetail, setCronDetail] = useState<any>('Every 1 hour');
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [payload, setPayload] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<any>({
    open: false,
    nodeId: null,
  });
  const edgesRef = useRef<any>([]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const nodeTypes: any = {
    task: SchedulerTaskNode,
    trigger: SchedulerTriggerNode,
  };

  const updateNodeData = (id: any, update: any) => {
    setNodes((nds: any[]) =>
      nds.map((n: any) =>
        n.id === id ? { ...n, data: { ...n.data, ...update } } : n
      )
    );
  };

  const handleFieldChange = (id: any, field: any, value: any) => {
    updateNodeData(id, {
      [field]:
        field === 'exit_code' || field === 'selectedTrigger'
          ? Number(value)
          : value,
    });
  };

  const handleTaskChange = (nodeId: any, selectedTaskId: any) => {
    setNodes((nds: any[]) =>
      nds.map((node: any) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                selectedTaskId,
                description:
                  node.data.taskOptions?.find(
                    (t: any) => t.id === selectedTaskId
                  )?.description || '',
              },
            }
          : node
      )
    );
  };

  const handleAddTrigger = (parentId: any) => {
    setNodes((prevNodes) => {
      const parent = prevNodes.find(
        (n: any) => String(n.id) === String(parentId)
      );
      if (!parent) {
        console.warn('Parent not found for ID:', parentId);
        return prevNodes;
      }

      const childPos = {
        x: parent.position.x + NODE_WIDTH + HORIZONTAL_GAP,
        y: parent.position.y + VERTICAL_GAP,
      };

      const newId = `${nodeIdCounter++}`;

      const newNode: any = {
        id: newId,
        type: 'trigger',
        position: childPos,
        data: {
          type: 'trigger',
          taskId: parent.data.taskId,
          triggerOptions,
          selectedTrigger: undefined,
          onFieldChange: handleFieldChange,
          onDeleteNode: handleDeleteNode,
          onAddTask: handleAddTask, // ✅ Ensure this is passed
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      setEdges((prevEdges: any[]) => [
        ...prevEdges,
        {
          id: `e-${parentId}-${newId}`,
          source: parentId,
          target: newId,
          type: 'straight',
          markerEnd: {
            width: 20,
            height: 20,
            color: '#2A2A2A',
          },
          style: {
            stroke: '#2A2A2A',
            strokeWidth: 2.5,
            strokeDasharray: '5 2',
          },
          animated: true,
        },
      ]);

      return [...prevNodes, newNode];
    });
  };

  const handleAddTask = (parentId: any) => {
    setNodes((prevNodes: any[]) => {
      const parent = prevNodes.find((n: any) => n.id === parentId);

      let position;
      if (!parentId || !parent) {
        // Root node
        position = { x: 100, y: 100 };
      } else {
        position = {
          x: parent.position.x + NODE_WIDTH + HORIZONTAL_GAP,
          y: parent.position.y + VERTICAL_GAP,
        };
      }

      const newId = `${nodeIdCounter++}`;

      const newNode: any = {
        id: newId,
        type: 'task',
        position,
        data: {
          type: 'task',
          taskId: `task-${newId}`,
          taskOptions: dummyTaskOptions,
          exitCodeOptions: triggerOptions,
          selectedTaskId: '',
          description: '',
          exit_code: '',
          exit_identifier: '',
          exit_description: '',
          onFieldChange: handleFieldChange,
          onTaskChange: handleTaskChange,
          onAddTrigger: handleAddTrigger,
          onDeleteNode: handleDeleteNode,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      // Add edge only if this is a child task (not root)
      if (parentId && parent) {
        setEdges((prevEdges: any[]) => [
          ...prevEdges,
          {
            id: `e-${parentId}-${newId}`,
            source: parentId,
            target: newId,
            type: 'straight',
            markerEnd: {
              width: 20,
              height: 20,
              color: '#2A2A2A',
            },
            style: {
              stroke: '#2A2A2A',
              strokeWidth: 2.5,
              strokeDasharray: '5 2',
            },
            animated: true,
          },
        ]);
      }

      return [...prevNodes, newNode];
    });
  };

  const handleDeleteNode = (nodeId: any) => {
    const connected = edgesRef.current.filter(
      (e: any) => e.source === nodeId || e.target === nodeId
    );
    if (connected.length) {
      setDeleteDialog({ open: true, nodeId });
    } else {
      deleteNodeAndChildren(nodeId);
    }
  };

  const deleteNodeAndChildren = (nodeId: any) => {
    const collectDescendants = (id: any, acc: any[] = []) => {
      const children = edges.filter((e: any) => e.source === id);
      const childIds = children.map((e: any) => e.target);
      acc.push(id);
      childIds.forEach((childId: any) => collectDescendants(childId, acc));
      return acc;
    };

    const idsToDelete = collectDescendants(nodeId);
    setNodes((nds: any[]) =>
      nds.filter((n: any) => !idsToDelete.includes(n.id))
    );
    const updatedEdges = edges.filter(
      (e: any) =>
        !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target)
    );
    setEdges(updatedEdges);
    edgesRef.current = updatedEdges;
  };

  const createWorkflowPayload = () => {
    const buildTree = (nodeId: any): any => {
      const node = nodes.find((n: any) => n.id === nodeId);
      if (!node) return null;

      if (node.type === 'task') {
        const childrenEdges = edges.filter((e: any) => e.source === nodeId);
        const triggerChildren: any = {};

        childrenEdges.forEach((edge: any) => {
          const triggerNode = nodes.find(
            (n: any) => n.id === edge.target && n.type === 'trigger'
          );
          if (!triggerNode) return;

          // const triggerKey = triggerNode.data.selectedTrigger;
          const triggerKeyObj = triggerOptions.find(
            (opt: any) => opt.value === triggerNode.data.selectedTrigger
          );
          const triggerKey = triggerKeyObj?.label ?? 'unknown-trigger';
          const taskEdge = edges.find(
            (e2: any) => e2.source === triggerNode.id
          );
          const taskNode =
            taskEdge && nodes.find((n: any) => n.id === taskEdge.target);

          if (taskNode) {
            triggerChildren[triggerKey] = buildTree(taskNode.id);
          }
        });

        // return {
        //   task_id: Number(node.data.selectedTaskId),
        //   description: node.data.exit_description || '',
        //   children: Object.keys(triggerChildren).length
        //     ? triggerChildren
        //     : undefined,
        // };

        return {
          task_id: node.data.selectedTaskId || null,
          identifier: node.data.exit_identifier || '',
          description: node.data.exit_description || '',
          children: Object.keys(triggerChildren).length
            ? triggerChildren
            : undefined,
        };
      }
      return null;
    };

    const rootTask = nodes.find((n: any) => n.type === 'task');
    if (!rootTask) {
      toast.error('Create a root task first.');
      return;
    }

    const payload = {
      project_id: Number(projectId),
      workflow_name: workflowName,
      scheduler_detail: {
        cron,
        detail: cronDetail,
      },
      tasks: buildTree(rootTask.id),
    };

    console.log('Payload:', payload);
    setPayload(payload);
  };

  return (
    <Card className="h-full border-none shadow-none p-0">
      <CardContent className="grid gap-6 h-full p-0">
        <div className="border-b pb-6">
          <h2 className="text-md font-semibold mb-4">Workflow Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="workflow-name">Name</Label>
              <Input
                id="workflow-name"
                placeholder="Enter workflow name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project" className="h-10 w-full">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {dummyProjects.map((proj) => (
                    <SelectItem key={proj.id} value={String(proj.id)}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-md font-semibold mb-4">Scheduler</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cron">CRON</Label>
              <Input
                id="cron"
                placeholder="e.g. 0 * * * *"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cron-detail">Cron Description</Label>
              <Input
                id="cron-detail"
                placeholder="e.g. Every 1 hour"
                value={cronDetail}
                onChange={(e) => setCronDetail(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </div>

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
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={(params) =>
                setEdges((eds) =>
                  addEdge(
                    {
                      ...params,
                      type: 'straight',
                      markerEnd: { width: 20, height: 20, color: '#2A2A2A' },
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
              <Background gap={12} size={1} />
            </ReactFlow>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={createWorkflowPayload}>Create Workflow</Button>
        </div>

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

        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, nodeId: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Deleting this node will also delete any nodes connected to it.
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
