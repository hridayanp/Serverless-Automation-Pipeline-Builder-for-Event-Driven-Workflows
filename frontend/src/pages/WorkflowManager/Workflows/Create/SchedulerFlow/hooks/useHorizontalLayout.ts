/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { NODE_WIDTH, HORIZONTAL_GAP } from '../constants';

/**
 * Layout logic for editable mode — mirrors view-only layout
 * Alternates children vertically (top, bottom) from the parent.
 */
export function useHorizontalLayout(nodes: any[]) {
  const calculateNextPosition = useCallback(
    (parent: any, nodeType: 'task' | 'trigger', siblingIndex: number = 0) => {
      if (!parent) return { x: 100, y: 100 };

      const nextX = parent.position.x + NODE_WIDTH + HORIZONTAL_GAP;
      const nodeHeight = getDefaultHeight(nodeType);
      const verticalGap = getGap(nodeType);

      // Alternate positioning: 1st below, 2nd above, 3rd further below, etc.
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

function getDefaultHeight(type: 'task' | 'trigger') {
  return type === 'task' ? 240 : 100;
}

function getGap(type: 'task' | 'trigger') {
  return type === 'task' ? 200 : 120;
}
