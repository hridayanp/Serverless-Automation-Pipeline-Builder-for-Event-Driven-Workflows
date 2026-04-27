/* eslint-disable react-hooks/exhaustive-deps */
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircle,
  ChevronDownIcon,
  Clock,
  Loader2,
  XCircle,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';

import { setProjects as setProjectState } from '@/redux/slices/workflowSlice';
import {
  getProjects,
  getWorkflowJobs,
  getWorkflowsForProject,
} from '@/api/ApiService';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';

export default function JobsMonitorDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useSelector((state: any) => state.workflow);

  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedWorkflowName, setSelectedWorkflowName] = useState<
    string | null
  >(null);

  const [jobStartDate, setJobStartDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const [jobEndDate, setJobEndDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(23, 0, 0, 0);
    return now;
  });

  const [workflowJobs, setWorkflowJobs] = useState<any[]>([]);

  // ── Fetch projects on mount (identical to original) ───────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await getProjects();
        if (Array.isArray(res?.data) && res.data.length > 0) {
          dispatch(setProjectState(res.data));

          const targetProjectId =
            location.state?.projectId?.toString() || res.data[0].id.toString();

          setSelectedProjectId(targetProjectId);
          await fetchWorkflows(targetProjectId);
        }
      } catch (e) {
        console.error('Error fetching projects:', e);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [dispatch, location.state]);

  // ── Fetch workflows for a selected project (identical to original) ─────────
  const fetchWorkflows = async (projectId: string) => {
    try {
      const res = await getWorkflowsForProject({ project_id: projectId });
      const workflowsData = res?.data?.data || [];
      setWorkflows(workflowsData);

      if (workflowsData.length > 0) {
        const targetWorkflowName =
          location.state?.workflowName || workflowsData[0].workflow_name;
        setSelectedWorkflowName(targetWorkflowName);
      } else {
        setSelectedWorkflowName(null);
      }
    } catch (e) {
      console.error('Error fetching workflows:', e);
      toast.error('Error fetching workflows');
    }
  };

  // ── Fetch jobs when workflow / dates change (identical to original) ─────────
  useEffect(() => {
    const workflow = workflows.find(
      (wf) => wf.workflow_name === selectedWorkflowName,
    );
    const workflow_id = workflow?.id;

    if (!workflow_id || !isValid(jobStartDate) || !isValid(jobEndDate)) return;

    const start = new Date(jobStartDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(jobEndDate);
    end.setHours(23, 0, 0, 0);

    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endDateOnly = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
    );

    if (start > end) {
      toast.error('Start date cannot be after end date');
      return;
    }

    if (endDateOnly > todayDateOnly) {
      toast.error('End date cannot be after today');
      return;
    }

    const payload = {
      workflow_id,
      start_date: format(start, 'yyyy-MM-dd HH:mm'),
      end_date: format(end, 'yyyy-MM-dd HH:mm'),
    };

    fetchWorkflowJobs.current(payload);
  }, [selectedWorkflowName, jobStartDate, jobEndDate]);

  const fetchWorkflowJobs = useRef(async (data: any) => {
    try {
      const res: any = await getWorkflowJobs(data);
      const logsData = res?.data?.data || res?.data;

      if (res?.status === 200 && Array.isArray(logsData)) {
        setWorkflowJobs(logsData);
        if (logsData.length === 0) {
          toast.error('No jobs found for the selected workflow');
        }
      } else {
        setWorkflowJobs([]);
        toast.error('Failed to fetch jobs');
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
      toast.error('Error fetching job logs');
    }
  });

  // ── Stats derived from workflowJobs ───────────────────────────────────────
  const stats = useMemo(() => {
    const success = workflowJobs.filter(
      (j) => j.workflow_status?.toLowerCase() === 'success',
    ).length;
    const failed = workflowJobs.filter(
      (j) => j.workflow_status?.toLowerCase() === 'failed',
    ).length;
    const running = workflowJobs.filter((j) => {
      const s = j.workflow_status?.toLowerCase();
      return s === 'executing' || s === 'running';
    }).length;

    return [
      {
        label: 'Total Jobs',
        value: workflowJobs.length,
        icon: GitBranch,
        color: 'primary',
      },
      {
        label: 'Successful',
        value: success,
        icon: CheckCircle2,
        color: 'secondary',
      },
      { label: 'Failed', value: failed, icon: AlertCircle, color: 'tertiary' },
      { label: 'Running', value: running, icon: Activity, color: 'primary' },
    ];
  }, [workflowJobs]);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      const firstProjectId = projects[0].id.toString();
      setSelectedProjectId(firstProjectId);
      fetchWorkflows(firstProjectId);
    }
  }, [projects]);

  useEffect(() => {
    if (!selectedWorkflowName && workflows.length > 0) {
      setSelectedWorkflowName(workflows[0].workflow_name);
    }
  }, [workflows]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fdfdfb] animate-in fade-in duration-500">
      {/* ── Project / Workflow selector bar (matches Tasks / Workflows) ── */}
      <div className="bg-[#fdfdfb] px-6 lg:px-8 py-4 max-w-[1600px] mx-auto border-b border-neutral-200/60">
        <div className="bg-white border border-neutral-100 rounded-xl shadow-sm px-5 py-3 flex items-center gap-4 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Project
          </span>
          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">
              Viewing jobs for:
            </span>

            {/* Project selector */}
            <Select
              value={selectedProjectId || ''}
              onValueChange={async (val) => {
                setSelectedProjectId(val);
                await fetchWorkflows(val);
              }}
            >
              <SelectTrigger className="w-[200px] h-9 text-sm font-semibold">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Workflow selector */}
            <Select
              value={selectedWorkflowName || ''}
              onValueChange={(val) => setSelectedWorkflowName(val)}
            >
              <SelectTrigger className="w-[200px] h-9 text-sm font-semibold">
                <SelectValue placeholder="Select Workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflows.length > 0 ? (
                  workflows.map((wf: any) => (
                    <SelectItem key={wf.workflow_name} value={wf.workflow_name}>
                      {wf.workflow_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="no-workflows">
                    No workflows found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {selectedWorkflowName && (
              <>
                <Separator
                  orientation="vertical"
                  className="h-5 hidden sm:block"
                />

                {/* Start date */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    From
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 px-3 text-sm font-semibold justify-between gap-2"
                      >
                        {jobStartDate.toLocaleDateString()}
                        <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={jobStartDate}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          if (date) {
                            const updated = new Date(date);
                            updated.setHours(0, 0, 0, 0);
                            setJobStartDate(updated);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End date */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    To
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 px-3 text-sm font-semibold justify-between gap-2"
                      >
                        {jobEndDate.toLocaleDateString()}
                        <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={jobEndDate}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          if (date) {
                            const updated = new Date(date);
                            updated.setHours(23, 0, 0, 0);
                            setJobEndDate(updated);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <span className="text-xs text-muted-foreground">
              {workflowJobs.length} job{workflowJobs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* ── Page heading ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#1a2c20]">
              Job Monitor
            </h1>
            <p className="text-muted-foreground text-sm">
              Track workflows, tasks, and jobs in real time.
            </p>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4"
            >
              <div
                className={`p-2.5 rounded-lg bg-${stat.color}/5 text-${stat.color}`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                  {stat.label}
                </p>
                <p className="text-xl font-bold text-[#1a2c20]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Jobs list ── */}
        {loading ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/10 rounded-full" />
              <div className="w-16 h-16 border-4 border-t-primary rounded-full animate-spin absolute top-0 left-0" />
            </div>
            <p className="text-xl font-bold text-primary tracking-tight">
              Loading Jobs
            </p>
          </div>
        ) : workflowJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5 bg-white rounded-xl border-2 border-dashed border-neutral-100">
            <div className="w-14 h-14 rounded-xl bg-neutral-50 flex items-center justify-center shadow-inner">
              <GitBranch className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#1a2c20]">
                No jobs found
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                No jobs found for the selected workflow and date range.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {workflowJobs.map((job: any) => {
              const successCount = job.task_logs.filter(
                (t: any) => t.status === 'success',
              ).length;
              const failedCount = job.task_logs.filter(
                (t: any) => t.status === 'failed',
              ).length;

              let StatusIcon = CheckCircle;
              let statusColor = 'text-green-600';
              const status = job.workflow_status?.toLowerCase();

              if (status === 'failed') {
                StatusIcon = XCircle;
                statusColor = 'text-red-600';
              } else if (status === 'queued') {
                StatusIcon = Clock;
                statusColor = 'text-gray-500';
              } else if (status === 'executing' || status === 'running') {
                StatusIcon = Loader2;
                statusColor = 'text-yellow-600 animate-spin';
              }

              return (
                <div
                  key={job.run_id}
                  onClick={() =>
                    navigate('/workflow/job-details', { state: { job } })
                  }
                  className="cursor-pointer bg-white rounded-xl border border-neutral-100 p-5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`w-5 h-5 mt-1 ${statusColor}`} />
                      <div>
                        <div className="text-lg font-bold text-[#1a2c20] group-hover:text-primary transition-colors">
                          {job.project_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Workflow Run ID:{' '}
                          <span className="font-medium text-foreground">
                            #{job.run_id}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Start: {job.start_date ?? 'N/A'}
                          {job.end_date && <> &rarr; End: {job.end_date}</>}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="text-green-600">
                            {successCount} Success
                          </span>{' '}
                          |{' '}
                          <span className="text-red-500">
                            {failedCount} Failed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
