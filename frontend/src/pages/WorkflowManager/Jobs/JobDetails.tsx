/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useLocation } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ListChecks,
  CheckCircle2,
  Flag,
  Timer,
  Terminal,
  ChevronRight,
  GitCommit,
  Loader2,
  XCircle,
  FileText,
} from 'lucide-react';
import { getWorkflowJobs, getTaskLogs } from '@/api/ApiService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

const taskStatusColorMap: Record<string, string> = {
  COMPLETED: '#22c55e', // green-500
  FAILED: '#ef4444', // red-500
  RUNNING: '#3b82f6', // blue-500
  PENDING: '#eab308', // yellow-500
};

const workflowStatusClassMap: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  EXECUTING: 'bg-blue-100 text-blue-800 border-blue-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
};

export default function JobDetailsPage() {
  const { state } = useLocation();
  const [job, setJob] = useState<any>(state?.job);
  const [selectedTaskLogs, setSelectedTaskLogs] = useState<string | null>(null);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [fetchingLogs, setFetchingLogs] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ── Polling Logic ────────────────────────────────────────────────────────
  const fetchLatestStatus = async () => {
    try {
      if (!job?.workflow_id || !job?.run_id) return;

      const res: any = await getWorkflowJobs({
        workflow_id: job.workflow_id,
        // Optional: you could add dates if needed to narrow down search
      });

      const logsData = res?.data?.data || res?.data;
      if (Array.isArray(logsData)) {
        const updatedJob = logsData.find((j: any) => j.run_id === job.run_id);
        if (updatedJob) {
          setJob(updatedJob);
          if (updatedJob.workflow_status !== 'EXECUTING') {
            stopPolling();
          }
        }
      }
    } catch (e) {
      console.error('Polling error:', e);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(fetchLatestStatus, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    if (job?.workflow_status === 'EXECUTING') {
      startPolling();
    }
    return () => stopPolling();
  }, [job?.workflow_status]);

  // ── Derived State ────────────────────────────────────────────────────────
  const taskLogs = useMemo(() => job?.task_logs || [], [job]);
  const executionPath = useMemo(() => job?.execution_path || [], [job]);

  const workflowStatus = job?.workflow_status?.toUpperCase() ?? 'UNKNOWN';
  const workflowBadgeClass =
    workflowStatusClassMap[workflowStatus] || 'bg-gray-200 text-gray-700';

  const stats = useMemo(() => {
    const totalTasks = taskLogs.length;
    const completedCount = taskLogs.filter(
      (t: any) => t.status === 'COMPLETED',
    ).length;

    const durationInSeconds =
      job?.start_date && job?.end_date
        ? Math.round(
            (new Date(job.end_date).getTime() -
              new Date(job.start_date).getTime()) /
              1000,
          )
        : null;

    return [
      {
        label: 'Total Tasks Run',
        value: totalTasks,
        footerTitle: 'Sequence Count',
        footerText: 'Total steps in this execution',
        icon: ListChecks,
        iconColor: 'text-indigo-500',
      },
      {
        label: 'Success Count',
        value: completedCount,
        footerTitle: 'Healthy Tasks',
        footerText: 'Tasks finished without errors',
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
        footerTitle: 'Current Phase',
        footerText: 'Overall lifecycle status',
        icon: Flag,
        iconColor: 'text-amber-500',
      },
      {
        label: 'Run Duration',
        value: durationInSeconds ? `${durationInSeconds}s` : '-',
        footerTitle: 'Execution Speed',
        footerText: 'Total wall-clock time',
        icon: Timer,
        iconColor: 'text-cyan-500',
      },
    ];
  }, [taskLogs, job, workflowStatus, workflowBadgeClass]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const viewTaskLogs = async (taskId: string, logKey?: string) => {
    try {
      setFetchingLogs(true);
      const res: any = await getTaskLogs({ taskId, log_key: logKey });
      const logs = res?.data?.data?.log_file_base64;
      if (logs) {
        setSelectedTaskLogs(atob(logs));
        setIsLogDialogOpen(true);
      } else {
        toast.error('No logs available for this task');
      }
    } catch (e) {
      console.error('Error fetching logs:', e);
      toast.error('Failed to retrieve task logs');
    } finally {
      setFetchingLogs(false);
    }
  };

  // ── Table Config ─────────────────────────────────────────────────────────
  const jobRunLogColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'task_name',
      header: 'Task Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-semibold">{row.getValue('task_name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => {
        const value: string = row.getValue('status');
        const color = taskStatusColorMap[value] ?? '#d1d5db';
        return (
          <Badge
            style={{ backgroundColor: color }}
            className="text-white font-medium capitalize"
          >
            {value.toLowerCase()}
          </Badge>
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
      id: 'actions',
      header: 'Logs',
      cell: ({ row }) => {
        const taskId = (job?.task_logs?.find((tl: any) => tl.task_name === row.original.task_name) as any)?.task_id || row.original.task_id;
        
        // Note: The API response might have task_id inside task_logs if we joined correctly
        // but for now we rely on the task_id being passed or mapped.
        
        return (
          <button
            onClick={() => viewTaskLogs(row.original.task_id || taskId, row.original.log_file_s3_key)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline group"
          >
            <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            View S3 Logs
          </button>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500 pb-12">
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
        <SectionHeading
          title={`Job Monitor : ${job?.project_name ?? 'Unknown'}`}
          description={
            (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">Run ID:</span>
                <span className="font-mono text-sm bg-muted/50 px-2 py-0.5 rounded border border-border">
                  {job?.run_id}
                </span>
                <Badge
                  className={cn(
                    'text-xs font-semibold border ml-2',
                    workflowBadgeClass,
                  )}
                >
                  {workflowStatus === 'EXECUTING' && (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  )}
                  {workflowStatus}
                </Badge>
              </div>
            ) as any
          }
          showBackButton
        />

        {/* Metrics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="bg-card border-border shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1 text-[11px] border-t border-neutral-50 pt-3">
                  <div className="flex gap-2 items-center font-bold text-muted-foreground uppercase tracking-tight">
                    {Icon && <Icon className={cn('w-3 h-3', stat.iconColor)} />}
                    {stat.footerTitle}
                  </div>
                  <div className="text-muted-foreground">{stat.footerText}</div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── LEFT: Execution Path Timeline ── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-primary" />
                Execution Flow
              </h2>
              {workflowStatus === 'EXECUTING' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 animate-pulse border-blue-100">
                  Real-time Tracking
                </Badge>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-[400px]">
              {executionPath.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-muted-foreground italic">
                  <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-20" />
                  Waiting for execution steps...
                </div>
              ) : (
                <div className="relative space-y-8">
                  {/* The vertical line */}
                  <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-neutral-100" />

                  {executionPath.map((step: any, idx: number) => (
                    <div key={idx} className="relative pl-10 group">
                      {/* Node circle */}
                      <div
                        className={cn(
                          'absolute left-0 top-1 w-7 h-7 rounded-full border-2 bg-card flex items-center justify-center z-10 transition-all',
                          step.success
                            ? 'border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                            : 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
                        )}
                      >
                        {step.success ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-foreground">
                            Task Run #{idx + 1}
                          </h3>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10px]">
                            ID: {step.task_id.slice(0, 8)}...
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {step.duration.toFixed(2)}s
                          </span>
                        </div>

                        {/* Branch Decision */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-widest">
                            <ChevronRight className="w-3 h-3" />
                            Branch: {step.branch_taken}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Active Task (RUNNING) */}
                  {taskLogs
                    .filter((t: any) => t.status === 'RUNNING')
                    .map((t: any) => (
                      <div key={t.task_id} className="relative pl-10 group">
                        <div className="absolute left-0 top-1 w-7 h-7 rounded-full border-2 border-blue-500 bg-card flex items-center justify-center z-10 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-blue-600 animate-pulse">
                              Executing: {t.task_name}
                            </h3>
                            <Badge className="text-[10px] bg-blue-500">ACTIVE</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Task is currently running in the serverless environment...
                          </p>
                        </div>
                      </div>
                    ))}

                  {/* End node if COMPLETED */}
                  {workflowStatus === 'COMPLETED' && (
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 w-7 h-7 rounded-full border-2 border-primary bg-primary text-white flex items-center justify-center z-10">
                        <Flag className="w-3.5 h-3.5" />
                      </div>
                      <div className="pt-1">
                        <h3 className="text-sm font-bold text-foreground">
                          Workflow Finished
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          All tasks executed successfully.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Task Details Table ── */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Detailed Task Logs
            </h2>
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <DataTable columns={jobRunLogColumns} data={taskLogs} />
            </div>
          </div>
        </div>
      </div>

      {/* ── LOG VIEWER DIALOG ── */}
      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-[1000px] w-[90dvw] max-h-[85dvh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl">
          <DialogHeader className="p-6 border-none bg-primary rounded-t-xl">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-background flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background/10 text-background">
                  <Terminal className="w-5 h-5" />
                </div>
                Execution Pipeline Logs (S3)
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed text-foreground/80 bg-background">
            {selectedTaskLogs ? (
              <pre className="whitespace-pre-wrap break-words">
                {selectedTaskLogs.split('\n').map((line, i) => {
                  let color = 'text-neutral-400';
                  if (line.includes('=== PIPELINE')) color = 'text-primary font-bold';
                  if (line.includes('=== STDOUT')) color = 'text-green-400 font-bold';
                  if (line.includes('=== STDERR')) color = 'text-red-400 font-bold';
                  if (line.includes('->')) color = 'text-blue-400 font-semibold';
                  
                  return (
                    <div key={i} className={cn("py-0.5", color)}>
                      {line}
                    </div>
                  );
                })}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 opacity-40">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading logs from S3...</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
             <button 
               onClick={() => setIsLogDialogOpen(false)}
               className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground/70 text-xs font-bold rounded-lg transition-colors"
             >
               Close Viewer
             </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
