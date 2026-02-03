/* eslint-disable react-hooks/exhaustive-deps */
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircle,
  ChevronDownIcon,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';

import { setProjects as setProjectState } from '@/redux/slices/workflowSlice';
import {
  getProjects,
  getWorkflowJobs,
  getWorkflowsForProject,
} from '@/api/ApiService';

import { SectionHeading } from '@/components/Headings/SectionHeading';
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

import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function JobsMonitorDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects } = useSelector((state: any) => state.workflow);

  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
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

  const [workflowJobs, setWorkflowJobs] = useState([]);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await getProjects();
        if (Array.isArray(res?.data) && res.data.length > 0) {
          dispatch(setProjectState(res.data));
          const firstProjectId = String(res.data[0].id);
          setSelectedProjectId(firstProjectId);
          await fetchWorkflows(firstProjectId);
        }
      } catch (e) {
        console.error('Error fetching projects:', e);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [dispatch]);

  // Fetch workflows for a selected project
  const fetchWorkflows = async (projectId: string) => {
    try {
      const res = await getWorkflowsForProject({ project_id: projectId });
      const workflowsData = res?.data?.data || [];
      setWorkflows(workflowsData);

      if (workflowsData.length > 0) {
        setSelectedWorkflowName(workflowsData[0].workflow_name);
      } else {
        setSelectedWorkflowName(null);
      }
    } catch (e) {
      console.error('Error fetching workflows:', e);
      toast.error('Error fetching workflows');
    }
  };

  useEffect(() => {
    const workflow = workflows.find(
      (wf) => wf.workflow_name === selectedWorkflowName
    );
    const workflow_id = workflow?.id;

    if (!workflow_id || !isValid(jobStartDate) || !isValid(jobEndDate)) return;

    // Normalize start and end times
    const start = new Date(jobStartDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(jobEndDate);
    end.setHours(23, 0, 0, 0);

    // Extract only the date part for today and end
    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endDateOnly = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate()
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

    console.log('✅ Valid payload:', payload);
    fetchWorkflowJobs.current(payload);
  }, [selectedWorkflowName, jobStartDate, jobEndDate]);

  const fetchWorkflowJobs = useRef(async (data: any) => {
    try {
      const res = await getWorkflowJobs(data);
      console.log('res', res);

      if (res?.status === 200 && res.data.length > 0) {
        setWorkflowJobs(res.data);
      } else {
        setWorkflowJobs([]);
        toast.error('No Logs found for the seelcted workflow');
      }
    } catch (e) {
      console.log('e', e);
    }
  });

  console.log('workflowJobs', workflowJobs);

  return (
    <div className="grid gap-6 px-4 sm:px-6 lg:px-8 py-4 max-w-screen-2xl mx-auto">
      <SectionHeading
        title="Job Monitor"
        description="Track workflows, tasks, and jobs in real time."
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Project Select */}
              <div className="flex flex-col gap-2">
                <Label className="px-1 text-sm font-medium">Project</Label>
                <Select
                  value={selectedProjectId || ''}
                  onValueChange={async (val) => {
                    setSelectedProjectId(val);
                    await fetchWorkflows(val);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem
                        key={project.id}
                        value={project.id.toString()}
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Workflow Select (no filtering) */}
              <div className="flex flex-col gap-2">
                <Label className="px-1 text-sm font-medium">Workflow</Label>
                <Select
                  value={selectedWorkflowName || ''}
                  onValueChange={(val) => setSelectedWorkflowName(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.length > 0 ? (
                      workflows.map((wf: any) => (
                        <SelectItem
                          key={wf.workflow_name}
                          value={wf.workflow_name}
                        >
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
              </div>

              {/* Start/End Dates only if workflow selected */}
              {selectedWorkflowName && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label className="px-1 text-sm font-medium">
                      Start Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          {jobStartDate.toLocaleDateString()}{' '}
                          <ChevronDownIcon />
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

                  <div className="flex flex-col gap-2">
                    <Label className="px-1 text-sm font-medium">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          {jobEndDate.toLocaleDateString()} <ChevronDownIcon />
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
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4">
        {workflowJobs && workflowJobs.length === 0 ? (
          <div className="text-muted-foreground text-sm italic text-center py-8">
            No jobs found for selected workflow.
          </div>
        ) : (
          workflowJobs.map((job: any) => {
            const successCount = job.task_logs.filter(
              (t: any) => t.status === 'success'
            ).length;
            const failedCount = job.task_logs.filter(
              (t: any) => t.status === 'failed'
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
                className="cursor-pointer rounded-2xl border border-border bg-background p-5 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <StatusIcon className={`w-5 h-5 mt-1 ${statusColor}`} />
                    <div>
                      <div className="text-lg font-semibold text-foreground">
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
                        {job.end_date && <> → End: {job.end_date}</>}
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
          })
        )}
      </div>
    </div>
  );
}
