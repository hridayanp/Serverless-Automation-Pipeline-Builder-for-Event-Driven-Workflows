/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Handle, Position } from '@xyflow/react';

// Color classes for different trigger types (same mapping as SchedulerTriggerNode)
const triggerColorClasses: Record<string, string> = {
  on_success: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
  on_failure: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
  on_completion: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
};

export default function ViewTriggerNode({ data }: any) {
  const triggerKey = data.selectedTrigger;
  const bgClass =
    triggerColorClasses[triggerKey] ||
    'bg-muted border-border text-foreground/80';

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
