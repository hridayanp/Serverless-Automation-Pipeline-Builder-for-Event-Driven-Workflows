/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Handle, Position } from '@xyflow/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

type SchedulerTriggerNodeProps = {
  id: string;
  data: {
    type: 'trigger';
    taskId: string;
    triggerOptions: { label: string; value: number }[];
    selectedTrigger?: number;
    onFieldChange?: (id: string, field: string, value: any) => void;
    onDeleteNode?: (nodeId: string) => void;
    onAddTask?: (parentId: string) => void;
  };
};

// Color classes for different trigger types
const triggerColorClasses: Record<number, string> = {
  0: 'bg-green-100 border-green-200',
  1: 'bg-red-100 border-red-200',
  2: 'bg-yellow-100 border-yellow-200',
};

export default function SchedulerTriggerNode({
  id,
  data,
}: SchedulerTriggerNodeProps) {
  const selected = data.triggerOptions?.find(
    (opt) => opt.value === data.selectedTrigger
  );

  const bgClass =
    data.selectedTrigger !== undefined
      ? triggerColorClasses[data.selectedTrigger] ||
        'bg-gray-100 border-blue-200'
      : 'bg-gray-100 border-blue-200';

  const handleAddTask = () => {
    if (data.selectedTrigger === undefined) {
      toast.error('Select a trigger first to enable new node');
      return;
    }
    data.onAddTask?.(id);
  };

  return (
    <div className="relative w-80">
      <div
        className={`shadow-md rounded-xl p-4 pt-2 pb-6 flex flex-col gap-4 relative border ${bgClass}`}
      >
        {/* Incoming Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 bg-muted"
        />

        {/* Delete Icon (top-right) */}
        {/* <div className="absolute top-1 right-2">
          <Trash2
            className="w-4 h-4 text-red-500 cursor-pointer"
            onClick={() => data.onDeleteNode?.(id)}
          />
        </div> */}

        {/* Dropdown */}
        <div className="flex flex-col gap-2 mt-4">
          <Select
            value={
              data.selectedTrigger !== undefined
                ? String(data.selectedTrigger)
                : ''
            }
            onValueChange={(value) =>
              data.onFieldChange?.(id, 'selectedTrigger', Number(value))
            }
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Select trigger">
                {selected?.label ?? 'Select trigger'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {data.triggerOptions?.map((opt: any) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Outgoing Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 bg-muted"
        />
      </div>

      {/* ➕ Add Task Button */}
      <button
        onClick={handleAddTask}
        className="absolute top-1/2 right-[-25px] -translate-y-1/2 bg-muted rounded-full p-2 border shadow hover:bg-primary hover:text-white transition"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
