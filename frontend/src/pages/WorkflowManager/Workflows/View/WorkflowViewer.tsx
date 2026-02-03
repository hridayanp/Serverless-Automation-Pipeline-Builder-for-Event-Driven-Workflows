/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  ReactFlow,
  MarkerType,
  type Node,
  type Edge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEffect, useState } from 'react';
import ViewTaskNode from './ViewNodes/ViewTaskNode';
import ViewTriggerNode from './ViewNodes/ViewTriggerNode';
import {
  getEdgeColorByTrigger,
  useViewOnlyLayout,
} from './hooks/useViewOnlyLayout';

const nodeTypes = {
  task: ViewTaskNode,
  trigger: ViewTriggerNode,
};

let viewNodeId = 1;

export default function WorkflowViewer({ workflow }: { workflow: any }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const { calculateNextPosition } = useViewOnlyLayout(nodes);

  useEffect(() => {
    const tempNodes: Node[] = [];
    const tempEdges: Edge[] = [];

    const buildView = (
      task: any,
      parentId: string | null = null,
      triggerType: string | null = null,
      parentNode: Node | null = null,
      siblingIndex: number = 0
    ) => {
      const nodeId = `view-node-${viewNodeId++}`;
      const position = parentNode
        ? calculateNextPosition(parentNode, 'task', siblingIndex)
        : { x: 100, y: 100 };

      const taskNode: Node = {
        id: nodeId,
        type: 'task',
        position,
        data: {
          type: 'task',
          taskId: task.task_id,
          selectedTaskId: task.task_id,
          exit_identifier: task.identifier,
          exit_description: task.description,
          taskOptions: [],
          exitCodeOptions: [],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: true,
      };

      tempNodes.push(taskNode);

      if (parentId) {
        tempEdges.push({
          id: `e-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.Arrow,
            width: 20,
            height: 20,
            color: getEdgeColorByTrigger(triggerType as any),
          },
          style: {
            stroke: getEdgeColorByTrigger(triggerType as any),
            strokeWidth: 2.5,
          },
        });
      }

      if (task.children) {
        const triggerEntries = Object.entries(task.children);

        for (let i = 0; i < triggerEntries.length; i++) {
          const [triggerKey, children] = triggerEntries[i];
          const childrenArray = Array.isArray(children) ? children : [children];

          const triggerNodeId = `view-node-${viewNodeId++}`;
          const triggerPosition = calculateNextPosition(taskNode, 'trigger', i);

          const triggerNode: Node = {
            id: triggerNodeId,
            type: 'trigger',
            position: triggerPosition,
            data: {
              type: 'trigger',
              selectedTrigger: triggerKey,
              triggerOptions: [],
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            draggable: true,
          };

          tempNodes.push(triggerNode);

          tempEdges.push({
            id: `e-${taskNode.id}-${triggerNodeId}`,
            source: taskNode.id,
            target: triggerNodeId,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.Arrow,
              width: 20,
              height: 20,
              color: getEdgeColorByTrigger(triggerType as any),
            },
            style: {
              stroke: getEdgeColorByTrigger(triggerType as any),
              strokeWidth: 2.5,
            },
          });

          for (let j = 0; j < childrenArray.length; j++) {
            buildView(
              childrenArray[j],
              triggerNodeId,
              triggerKey,
              triggerNode,
              j
            );
          }
        }
      }
    };

    viewNodeId = 1;
    if (workflow?.tasks) {
      buildView(workflow.tasks);
    }

    setNodes(tempNodes);
    setEdges(tempEdges);
  }, [workflow]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      nodesDraggable={true}
      defaultViewport={{ x: 0, y: 0, zoom: 0.3 }}
    />
  );
}
