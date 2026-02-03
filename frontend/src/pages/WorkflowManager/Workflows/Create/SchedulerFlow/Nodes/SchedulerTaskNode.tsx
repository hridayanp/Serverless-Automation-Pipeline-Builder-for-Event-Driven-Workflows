/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Handle, Position } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

type SchedulerTaskNodeProps = {
  id: string;
  data: {
    type: 'task';
    taskId: string;
    taskOptions?: { id: string; name: string; description: string }[];
    selectedTaskId?: string;
    exit_identifier?: string;
    exit_description?: string;
    onTaskChange?: (id: string, value: string) => void;
    onFieldChange?: (id: string, field: string, value: any) => void;
    onAddTrigger?: (parentId: string) => void;
    onDeleteNode?: (nodeId: string) => void;
  };
};

export default function SchedulerTaskNode({
  id,
  data,
}: SchedulerTaskNodeProps) {
  const selectedTask = data.taskOptions?.find(
    (t) => t.id === data.selectedTaskId
  );

  return (
    <div className="relative w-96">
      <div className="bg-white border shadow-md rounded-xl p-5 flex flex-col gap-5 relative">
        {/* Incoming Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 bg-muted"
        />

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-sm text-gray-800">Task</h2>
          <Trash2
            className="w-4 h-4 text-red-500 cursor-pointer"
            onClick={() => data.onDeleteNode?.(id)}
          />
        </div>

        {/* Task Selector */}
        <Select
          value={data.selectedTaskId ?? ''}
          onValueChange={(value) => data.onTaskChange?.(id, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select task" />
          </SelectTrigger>
          <SelectContent>
            {data.taskOptions?.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Task Description Preview */}
        {selectedTask?.description && (
          <p className="pl-2 text-xs text-muted-foreground italic">
            {selectedTask.description}
          </p>
        )}

        {/* Identifier */}
        <Input
          placeholder="Enter a unique identifier"
          value={data.exit_identifier ?? ''}
          onChange={(e) =>
            data.onFieldChange?.(id, 'exit_identifier', e.target.value)
          }
          className="h-10 text-sm placeholder-gray-500"
        />

        {/* Custom Description (with 255 char max) */}
        <textarea
          placeholder="Write a task description"
          value={data.exit_description ?? ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue.length <= 255) {
              data.onFieldChange?.(id, 'exit_description', newValue);
            }
          }}
          rows={3}
          className="resize-none w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Outgoing Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 bg-muted"
        />
      </div>

      {/* ➕ Add Trigger Button (same style as TriggerNode) */}
      <button
        onClick={() => data.onAddTrigger?.(id)}
        className="absolute top-1/2 right-[-25px] -translate-y-1/2 bg-muted rounded-full p-2 border shadow hover:bg-primary hover:text-white transition"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
