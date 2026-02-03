/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef } from 'react';
import {
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from '@xyflow/react';
import { triggerOptions } from '../constants';
import { useHorizontalLayout } from '../hooks/useHorizontalLayout';
import { getEdgeColorByTrigger } from '../../../View/hooks/useViewOnlyLayout';

let nodeIdCounter = 1;

export function useSchedulerGraph(taskOptions: any) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  const edgesRef = useRef<any[]>([]);
  const nodesRef = useRef<any[]>([]);

  useEffect(() => {
    edgesRef.current = edges;
    nodesRef.current = nodes;
  }, [edges, nodes]);

  const { calculateNextPosition } = useHorizontalLayout(nodes);

  const updateNodeData = useCallback((id: any, update: any) => {
    setNodes((nds: any[]) =>
      nds.map((n: any) =>
        n.id === id ? { ...n, data: { ...n.data, ...update } } : n
      )
    );
  }, []);

  const handleFieldChange = useCallback(
    (id: any, field: any, value: any) => {
      updateNodeData(id, {
        [field]: ['exit_code', 'selectedTrigger'].includes(field)
          ? Number(value)
          : value,
      });
    },
    [updateNodeData]
  );

  const handleTaskChange = useCallback((nodeId: any, selectedTaskId: any) => {
    setNodes((nds: any[]) =>
      nds.map((node: any) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, selectedTaskId } }
          : node
      )
    );
  }, []);

  const deleteNodeAndChildren = useCallback((nodeId: any) => {
    const collectDescendants = (id: any, acc: any[] = []) => {
      const children = edgesRef.current
        .filter((e: any) => e.source === id)
        .map((e: any) => e.target);
      acc.push(id);
      children.forEach((childId: any) => collectDescendants(childId, acc));
      return acc;
    };

    const idsToDelete = collectDescendants(nodeId);
    setNodes((nds: any[]) =>
      nds.filter((n: any) => !idsToDelete.includes(n.id))
    );
    setEdges((eds: any[]) =>
      eds.filter(
        (e: any) =>
          !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target)
      )
    );
  }, []);

  const handleAddTrigger = useCallback(
    (parentId: any) => {
      setNodes((prevNodes: any[]) => {
        const parent = prevNodes.find((n: any) => n.id === parentId);
        if (!parent) return prevNodes;

        // 🔼 NEW: Get count of current trigger siblings
        const siblingTriggers = prevNodes.filter(
          (n: any) =>
            n.type === 'trigger' &&
            edgesRef.current.some(
              (e: any) => e.source === parentId && e.target === n.id
            )
        );
        const siblingIndex = siblingTriggers.length;

        const position = calculateNextPosition(parent, 'trigger', siblingIndex);
        const newId = `${nodeIdCounter++}`;

        const newNode: any = {
          id: newId,
          type: 'trigger',
          position,
          data: {
            type: 'trigger',
            taskId: parent.data.taskId,
            triggerOptions,
            selectedTrigger: undefined,
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
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              width: 20,
              height: 20,
              color: getEdgeColorByTrigger(newNode.data.selectedTrigger),
              type: MarkerType.Arrow,
            },
            style: {
              stroke: getEdgeColorByTrigger(newNode.data.selectedTrigger),
              strokeWidth: 2.5,
            },
          },
        ]);

        return [...prevNodes, newNode];
      });
    },
    [calculateNextPosition, setEdges]
  );

  const handleAddTaskRef = useRef<any>(null);

  const handleAddTask = useCallback(
    (parentId?: any) => {
      const parentNode = nodesRef.current.find((n) => n.id === parentId);
      const triggerType = parentNode?.data?.selectedTrigger;

      setNodes((prev: any[]) => {
        const parent = parentId ? prev.find((n) => n.id === parentId) : null;

        // 🔼 NEW: Get count of current task siblings
        const siblingTasks = nodesRef.current.filter(
          (n: any) =>
            n.type === 'task' &&
            edgesRef.current.some(
              (e: any) => e.source === parentId && e.target === n.id
            )
        );
        const siblingIndex = siblingTasks.length;

        const position = parent
          ? calculateNextPosition(parent, 'task', siblingIndex)
          : { x: 100, y: 100 };

        const newId = `${nodeIdCounter++}`;

        const newNode: any = {
          id: newId,
          type: 'task',
          position,
          data: {
            type: 'task',
            taskId: `task-${newId}`,
            taskOptions,
            exitCodeOptions: triggerOptions,
            selectedTaskId: '',
            exit_code: '',
            exit_identifier: '',
            exit_description: '',
            onFieldChange: handleFieldChange,
            onTaskChange: handleTaskChange,
            onAddTrigger: handleAddTrigger,
            onDeleteNode: () => deleteNodeAndChildren(newId),
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };

        if (parentId && parent) {
          setEdges((prevEdges: any[]) => [
            ...prevEdges,
            {
              id: `e-${parentId}-${newId}`,
              source: parentId,
              target: newId,
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                width: 20,
                height: 20,
                color: getEdgeColorByTrigger(triggerType),
                type: MarkerType.Arrow,
              },
              style: {
                stroke: getEdgeColorByTrigger(triggerType),
                strokeWidth: 2.5,
              },
            },
          ]);
        }

        return [...prev, newNode];
      });
    },
    [
      taskOptions,
      calculateNextPosition,
      setNodes,
      setEdges,
      handleFieldChange,
      handleTaskChange,
      handleAddTrigger,
      deleteNodeAndChildren,
    ]
  );

  useEffect(() => {
    handleAddTaskRef.current = handleAddTask;
  }, [handleAddTask]);

  const injectDeleteHandler = (requestDelete: (id: string) => void) => {
    return nodes.map((node: any) => {
      if (node.type === 'task') {
        return {
          ...node,
          data: {
            ...node.data,
            onFieldChange: handleFieldChange,
            onTaskChange: handleTaskChange,
            onAddTrigger: handleAddTrigger,
            onDeleteNode: () => requestDelete(node.id),
          },
        };
      }

      if (node.type === 'trigger') {
        return {
          ...node,
          data: {
            ...node.data,
            onFieldChange: handleFieldChange,
            onAddTask: handleAddTaskRef.current,
            onDeleteNode: () => requestDelete(node.id),
          },
        };
      }

      return node;
    });
  };

  const generateWorkflowPayload = useCallback(() => {
    const buildTaskTree = (nodeId: string): any => {
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (!node || node.type !== 'task') return null;

      const task: any = {
        task_id: node.data.selectedTaskId || node.data.taskId,
        description: node.data.exit_description || '',
      };

      // Find trigger nodes connected to this task
      const triggerEdges = edgesRef.current.filter((e) => e.source === nodeId);
      const triggerChildren: Record<string, any[]> = {};

      for (const edge of triggerEdges) {
        const triggerNode = nodesRef.current.find(
          (n) => n.id === edge.target && n.type === 'trigger'
        );
        if (!triggerNode) continue;

        const triggerType = triggerNode.data.selectedTrigger;
        if (!triggerType) continue;

        // Find task nodes connected to this trigger
        const childEdges = edgesRef.current.filter(
          (e) => e.source === triggerNode.id
        );

        for (const childEdge of childEdges) {
          const childTaskNode = nodesRef.current.find(
            (n) => n.id === childEdge.target && n.type === 'task'
          );
          if (!childTaskNode) continue;

          const childTask = buildTaskTree(childEdge.target);
          if (childTask) {
            childTask.identifier = childTaskNode.data.exit_identifier || '';
            childTask.on_exit_code = childTaskNode.data.exit_code || undefined;

            if (!triggerChildren[triggerType]) {
              triggerChildren[triggerType] = [];
            }

            triggerChildren[triggerType].push(childTask);
          }
        }
      }

      if (Object.keys(triggerChildren).length > 0) {
        task.children = triggerChildren;
      }

      return task;
    };

    const rootTaskNode = nodesRef.current.find(
      (n) =>
        n.type === 'task' && !edgesRef.current.some((e) => e.target === n.id)
    );

    if (!rootTaskNode) return null;

    return buildTaskTree(rootTaskNode.id);
  }, []);

  return {
    nodes,
    edges,
    setEdges,
    onNodesChange,
    onEdgesChange,
    handleAddTask,
    handleAddTrigger,
    handleFieldChange,
    handleTaskChange,
    deleteNodeAndChildren,
    injectDeleteHandler,
    generateWorkflowPayload,
  };
}
