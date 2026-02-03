/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import {
  NODE_WIDTH,
  HORIZONTAL_GAP,
} from '@/pages/WorkflowManager/Workflows/Create/SchedulerFlow/constants';

/**
 * View-only layout: Prevents overlaps and alternates Y positions (top/down).
 */
export function useViewOnlyLayout(nodes: any[]) {
  const calculateNextPosition = useCallback(
    (parent: any, nodeType: 'task' | 'trigger', siblingIndex = 0) => {
      if (!parent) return { x: 100, y: 100 };

      const nextX = parent.position.x + NODE_WIDTH + HORIZONTAL_GAP;
      const nodeHeight = getDefaultHeight(nodeType);
      const verticalGap = getGap(nodeType);

      // Alternate: first below, then above, then lower, then upper, etc.
      const offset =
        Math.floor((siblingIndex + 1) / 2) * (nodeHeight + verticalGap);
      const direction = siblingIndex % 2 === 0 ? 1 : -1;
      const nextY = parent.position.y + direction * offset;

      return { x: nextX, y: nextY };
    },
    [nodes]
  );

  return { calculateNextPosition };
}

// Heights and spacing
function getDefaultHeight(type: 'task' | 'trigger') {
  return type === 'task' ? 240 : 100;
}

function getGap(type: 'task' | 'trigger') {
  return type === 'task' ? 200 : 120;
}

// utils/getEdgeColorByTrigger.ts
export function getEdgeColorByTrigger(triggerType?: string | number): string {
  const typeMap: Record<number, string> = {
    0: 'on_completion',
    1: 'on_failure',
    2: 'on_success',
  };

  const colorMap: Record<string, string> = {
    on_success: '#22c55e', // green-500
    on_failure: '#ef4444', // red-500
    on_completion: '#eab308', // yellow-500
  };

  const mappedType =
    typeof triggerType === 'number' ? typeMap[triggerType] : triggerType;
  return colorMap[mappedType ?? ''] || '#2A2A2A';
}
