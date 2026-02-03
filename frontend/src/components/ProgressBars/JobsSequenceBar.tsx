'use client';

import { Clock } from 'lucide-react';

type JobStatus = 'success' | 'failed';

type JobSequenceBarProps = {
  jobs: JobStatus[]; // Array of job statuses
  date: string; // Label like "12 min ago" or a timestamp
};

export default function JobSequenceBar({ jobs, date }: JobSequenceBarProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      {/* Time indicator */}
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <Clock className="w-4 h-4" />
        <span>{date}</span>
      </div>
      {/* Bar sequence */}
      <div className="flex items-center mt-1">
        <div className="flex gap-[1px] overflow-hidden">
          {jobs.map((status, i) => (
            <div
              key={i}
              className={`w-[10px] h-7 rounded-sm ${
                status === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          ))}
        </div>
      </div>
      {/* Summary stats */}
    </div>
  );
}
