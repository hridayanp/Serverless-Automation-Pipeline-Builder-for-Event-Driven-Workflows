'use client';

import { Clock } from 'lucide-react';

type JobStatus = 'success' | 'failed';

type PipelineStatusBarProps = {
  value: number;
  max?: number;
  duration: string;
  status: JobStatus;
};

export default function PipelineStatusBar({
  value,
  max = 100,
  duration,
  status,
}: PipelineStatusBarProps) {
  const percent = Math.min(100, Math.floor((value / max) * 100));
  const filledBars = Math.floor((percent / 100) * 20);
  const color =
    status === 'success'
      ? 'bg-green-500 text-green-600'
      : 'bg-red-500 text-red-600';

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <Clock className="w-4 h-4" />
        <span>{duration}</span>
      </div>
      <div className="flex items-center mt-1">
        <div className="flex gap-[1px] overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-[4px] h-5 rounded-sm ${
                i < filledBars ? color.split(' ')[0] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className={`ml-2 text-sm ${color.split(' ')[1]}`}>
          {percent}%
        </span>
      </div>
    </div>
  );
}
