/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { SectionHeading } from '@/components/Headings/SectionHeading';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/Table/Table';
import { TimeSeries } from '@/components/Charts/TimeSeries';
import { cn } from '@/lib/utils'; // utility to merge class names
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ListChecks, CheckCircle2, Flag, Timer } from 'lucide-react';

const taskStatusColorMap: Record<string, string> = {
  on_success: '#22c55e', // green-500
  on_failure: '#ef4444', // red-500
  on_completion: '#eab308', // yellow-500
};

const taskStatusDescriptions: Record<string, string> = {
  on_success: 'Executed successfully without errors.',
  on_failure: 'Task failed during execution.',
  on_completion: 'Triggered regardless of success or failure.',
};

const workflowStatusClassMap: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  EXECUTING: 'bg-blue-100 text-blue-800 border-blue-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
};

export default function JobDetailsPage() {
  const { state } = useLocation();
  const job = state?.job;

  const taskLogs = useMemo(() => job?.task_logs || [], [job]);

  const workflowStatus = job?.workflow_status?.toUpperCase() ?? 'UNKNOWN';
  const workflowBadgeClass =
    workflowStatusClassMap[workflowStatus] || 'bg-gray-200 text-gray-700';

  const stats = useMemo(() => {
    const totalTasks = taskLogs.length;
    const onCompletionCount = taskLogs.filter(
      (t: any) => t.status === 'on_completion'
    ).length;

    const durationInSeconds =
      job?.start_date && job?.end_date
        ? Math.round(
            (new Date(job.end_date).getTime() -
              new Date(job.start_date).getTime()) /
              1000
          )
        : null;

    return [
      {
        label: 'Total Tasks',
        value: totalTasks,
        footerTitle: 'Executed Tasks',
        footerText: 'Total no. of tasks executed',
        icon: ListChecks,
        iconColor: 'text-indigo-500',
      },
      {
        label: 'Completed Tasks',
        value: onCompletionCount,
        footerTitle: 'Completion',
        footerText: 'Tasks completed on exit',
        icon: CheckCircle2,
        iconColor: 'text-emerald-500',
      },
      {
        label: 'Workflow Status',
        value: (
          <Badge
            className={cn('text-sm font-semibold border', workflowBadgeClass)}
          >
            {workflowStatus}
          </Badge>
        ),
        footerTitle: 'Final State',
        footerText: 'Overall workflow outcome',
        icon: Flag,
        iconColor: 'text-amber-500',
      },
      {
        label: 'Job Duration',
        value: durationInSeconds ? `${durationInSeconds}s` : '-',
        footerTitle: 'Execution Time',
        footerText: 'Time to complete workflow',
        icon: Timer,
        iconColor: 'text-cyan-500',
      },
    ];
  }, [taskLogs, job, workflowStatus, workflowBadgeClass]);

  const jobRunLogColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'task_name',
      header: 'Task Name',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => {
        const value: string = row.getValue('status');
        const color = taskStatusColorMap[value] ?? '#d1d5db';
        const label = value.replace('on_', '').replace('_', ' ');
        const description = taskStatusDescriptions[value] ?? 'Unknown status';

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  style={{ backgroundColor: color }}
                  className="text-white font-medium capitalize cursor-default"
                >
                  {label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="text-sm max-w-[220px] bg-white text-black border border-gray-300 shadow-md">
                <div className="mb-1 font-semibold text-gray-700">
                  Status Legend
                </div>
                <ul className="space-y-1">
                  {Object.entries(taskStatusColorMap).map(([key, hex]) => (
                    <li key={key} className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="capitalize font-medium">
                        {key.replace('on_', '').replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
                <hr className="my-2 border-gray-300" />
                <p className="text-gray-600">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: 'start_date',
      header: 'Started At',
      cell: ({ row }: { row: any }) =>
        row.getValue('start_date')
          ? new Date(row.getValue('start_date')).toLocaleString()
          : '-',
    },
    {
      accessorKey: 'end_date',
      header: 'Ended At',
      cell: ({ row }: { row: any }) =>
        row.getValue('end_date')
          ? new Date(row.getValue('end_date')).toLocaleString()
          : '-',
    },
  ];

  const chartData = useMemo(() => {
    return taskLogs.map((log: any, index: number) => ({
      timestamp: new Date(log.start_date).getTime() / 1000 + index * 60,
      value: 1,
    }));
  }, [taskLogs]);

  return (
    <div className="grid gap-6 p-4 max-w-7xl mx-auto lg:px-6">
      <SectionHeading
        title={`Job Details : ${job?.project_name ?? 'Unknown'}`}
        description={
          (
            <>
              Run ID: {job?.run_id}{' '}
              <span className="mx-2 text-muted-foreground">|</span>
              <Badge
                className={cn(
                  'text-xs font-semibold border',
                  workflowBadgeClass
                )}
              >
                {workflowStatus}
              </Badge>
            </>
          ) as any
        }
        showBackButton
      />

      {/* Metrics Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-2xl font-semibold">
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="flex gap-2 items-center font-medium text-muted-foreground">
                    {stat.footerTitle}
                    {Icon && (
                      <Icon
                        className={cn('w-4 h-4', stat.iconColor)}
                        strokeWidth={1.8}
                      />
                    )}
                  </div>
                  <div className="text-muted-foreground">{stat.footerText}</div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Run Logs Table */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Task Logs</h2>
        <div className="rounded border border-muted w-full">
          <DataTable columns={jobRunLogColumns} data={taskLogs} />
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Execution Timeline</h2>
        <div className="grid gap-4">
          <TimeSeries
            title="Task Executions"
            graphType="line"
            data={chartData}
          />
        </div>
      </div>
    </div>
  );
}
