/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Handle, Position } from '@xyflow/react';

export default function ViewTaskNode({ data }: any) {
  return (
    <div className="relative w-96">
      <div className="bg-white border shadow-md rounded-xl p-5 flex flex-col gap-2 relative">
        {/* Incoming Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 bg-muted"
        />

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-sm text-gray-800">Task</h2>
        </div>

        {/* Task ID */}
        <div className="text-sm">
          <span className="text-muted-foreground font-medium">Task ID:</span>{' '}
          {data.taskId || 'N/A'}
        </div>

        {/* Identifier */}
        <div className="text-sm">
          <span className="text-muted-foreground font-medium">Identifier:</span>{' '}
          {data.exit_identifier || '—'}
        </div>

        {/* Description */}
        <div className="text-sm whitespace-pre-wrap">
          <span className="text-muted-foreground font-medium">
            Description:
          </span>{' '}
          {data.exit_description || '—'}
        </div>

        {/* Outgoing Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 bg-muted"
        />
      </div>
    </div>
  );
}
