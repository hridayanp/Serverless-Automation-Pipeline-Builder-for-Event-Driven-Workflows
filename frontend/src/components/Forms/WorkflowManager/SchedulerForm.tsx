/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CronForm from './CronForm';
import { getProjectEnvironments, getTasks } from '@/api/ApiService';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setTasks } from '@/redux/slices/workflowSlice';

type Props = {
  workflowName: string;
  setWorkflowName: (name: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  envId: string;
  setEnvId: (id: string) => void;
  cron: string;
  setCron: (val: string) => void;
  cronDetail: string;
  setCronDetail: (val: string) => void;
  projects: { id: string; name: string }[];
};

export default function SchedulerForm({
  workflowName,
  setWorkflowName,
  projectId,
  setProjectId,
  envId,
  setEnvId,
  cron,
  setCron,
  cronDetail,
  setCronDetail,
  projects,
}: Props) {
  const dispatch = useDispatch();

  const [envOptions, setEnvOptions] = useState<any>([]);
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [showEnvSelect, setShowEnvSelect] = useState(false);

  useEffect(() => {
    const fetchTasksByProject = async () => {
      if (!projectId) return;

      try {
        const res = await getTasks({ project_id: projectId });

        if (res?.status === 200 && Array.isArray(res.data)) {
          dispatch(setTasks(res.data));
        } else {
          toast.error('No tasks found for the selected project');
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        toast.error('Error fetching tasks');
      }
    };

    fetchTasksByProject();
  }, [projectId]);

  useEffect(() => {
    const fetchEnvironments = async () => {
      if (!projectId) return;
      setLoadingEnv(true);
      setShowEnvSelect(false);

      try {
        const res = await getProjectEnvironments({ projectId });
        if (res?.data?.status === 'success' && Array.isArray(res.data.data)) {
          setEnvOptions(res.data.data);
          setShowEnvSelect(true);
        } else {
          toast.error('No environments found');
          setEnvOptions([]);
        }
      } catch (error) {
        console.error('Error fetching environments:', error);
        toast.error('Failed to fetch environments');
        setEnvOptions([]);
      } finally {
        setLoadingEnv(false);
      }
    };

    fetchEnvironments();
  }, [projectId]);

  return (
    <>
      {/* Workflow Details */}
      <div className="border-b pb-6">
        <div
          className={`grid ${
            showEnvSelect || loadingEnv ? 'grid-cols-3' : 'grid-cols-2'
          } gap-4`}
        >
          {/* Workflow Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              placeholder="Enter workflow name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Project Selector */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={projectId}
              onValueChange={(val) => {
                setProjectId(val);
                setEnvId('');
              }}
            >
              <SelectTrigger id="project" className="h-10 w-full">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={String(proj.id)}>
                    {proj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Environment Dropdown or Loader */}
          {loadingEnv ? (
            <div className="flex items-center justify-start gap-2 pt-[22px]">
              <div className="w-5 h-5 border-2 border-t-transparent border-gray-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-600">
                Fetching environments...
              </span>
            </div>
          ) : showEnvSelect ? (
            <div className="flex flex-col gap-2">
              <Label>Environment</Label>
              <Select value={envId} onValueChange={(val) => setEnvId(val)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select Environment" />
                </SelectTrigger>
                <SelectContent>
                  {envOptions.map((env: any) => (
                    <SelectItem key={env.id} value={String(env.id)}>
                      {env.language} - {env.env_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </div>

      <CronForm
        cron={cron}
        cronDetail={cronDetail}
        onChangeCron={setCron}
        onChangeCronDetail={setCronDetail}
      />
    </>
  );
}
