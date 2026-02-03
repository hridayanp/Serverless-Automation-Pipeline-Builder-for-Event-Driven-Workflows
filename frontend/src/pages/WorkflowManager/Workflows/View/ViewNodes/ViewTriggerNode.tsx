/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Handle, Position } from '@xyflow/react';

// Color classes for different trigger types (same mapping as SchedulerTriggerNode)
const triggerColorClasses: Record<string, string> = {
  on_success: 'bg-green-100 border-green-200 text-green-800',
  on_failure: 'bg-red-100 border-red-200 text-red-800',
  on_completion: 'bg-yellow-100 border-yellow-200 text-yellow-800',
};

export default function ViewTriggerNode({ data }: any) {
  const triggerKey = data.selectedTrigger;
  const bgClass =
    triggerColorClasses[triggerKey] ||
    'bg-gray-100 border-gray-300 text-gray-800';

  return (
    <div className="relative w-64">
      <div
        className={`shadow-md text-center rounded-xl p-4 flex flex-col gap-2 relative border ${bgClass}`}
      >
        {/* Incoming Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 bg-muted"
        />

        {/* Title */}
        <div className="text-sm font-medium">
          Trigger : <span className="capitalize">{triggerKey || 'N/A'}</span>
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
