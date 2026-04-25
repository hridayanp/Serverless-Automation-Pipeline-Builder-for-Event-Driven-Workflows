/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { SectionHeading } from '@/components/Headings/SectionHeading';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  getProjects,
  getTasks,
  getWorkflowsForProject,
} from '@/api/ApiService';
import { setProjects } from '@/redux/slices/workflowSlice';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { projects } = useSelector((state: any) => state.workflow);

  const [loading, setLoading] = useState(true);
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [workflowsData, setWorkflowsData] = useState<any[]>([]);

  /* -------------------------------
     Navigation Handler
  --------------------------------*/
  const handleCardClick = (label: string) => {
    switch (label) {
      case 'Total Projects':
        navigate('/workflow/projects');
        break;
      case 'Total Tasks':
        navigate('/workflow/tasks');
        break;
      case 'Total Workflows':
        navigate('/workflow/details');
        break;
      case 'Total Workflows Executed':
        toast('Execution tracking coming soon!');
        break;
      default:
        break;
    }
  };

  /* -------------------------------
     Fetch Tasks
  --------------------------------*/
  const fetchTasks = async (projectId: string) => {
    try {
      const res = await getTasks({ project_id: projectId });

      let data: any[] = [];

      if (Array.isArray(res?.data)) {
        data = res.data;
      } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
      }

      setTasksData(data);
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
      setTasksData([]);
    }
  };

  /* -------------------------------
     Fetch Workflows
  --------------------------------*/
  const fetchWorkflows = async (projectId: string) => {
    try {
      const res = await getWorkflowsForProject({ project_id: projectId });

      const data = res?.data?.data;

      if (res?.status === 200 && Array.isArray(data)) {
        setWorkflowsData(data);
      } else {
        setWorkflowsData([]);
      }
    } catch (e) {
      console.error('Failed to fetch workflows:', e);
      setWorkflowsData([]);
    }
  };

  /* -------------------------------
     Load Dashboard Data
  --------------------------------*/
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      let projectList = projects;

      /* Fetch projects if redux empty */
      if (!projectList || projectList.length === 0) {
        const res = await getProjects();
        const fetchedProjects = res?.data;

        if (Array.isArray(fetchedProjects) && fetchedProjects.length > 0) {
          dispatch(setProjects(fetchedProjects));
          projectList = fetchedProjects;
        } else {
          toast.error('No projects found');
          dispatch(setProjects([]));
          return;
        }
      }

      const firstProjectId = projectList[0]?.id;

      if (!firstProjectId) return;

      await Promise.all([
        fetchTasks(firstProjectId),
        fetchWorkflows(firstProjectId),
      ]);
    } catch (err) {
      toast.error('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* -------------------------------
     Stats Cards
  --------------------------------*/
  const stats = [
    {
      label: 'Total Projects',
      value: projects?.length || 0,
      footer:
        'These are collections that help organize your work into clear goals.',
    },
    {
      label: 'Total Tasks',
      value: tasksData?.length || 0,
      footer:
        'Each task is a single piece of work, like a script or job that does something useful.',
    },
    {
      label: 'Total Workflows',
      value: workflowsData?.length || 0,
      footer:
        'A workflow is a chain of tasks that run one after another to get things done automatically.',
    },
    {
      label: 'Total Workflows Executed',
      value: 12, // Dummy for now
      footer:
        'This shows how many workflows actually ran — we’ll show this soon!',
    },
  ];

  /* -------------------------------
     Loading UI
  --------------------------------*/
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin" />
          <p className="text-lg font-medium text-gray-700">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------
     Dashboard UI
  --------------------------------*/
  return (
    <div className="grid gap-6 p-4 max-w-7xl mx-auto lg:px-6">
      <SectionHeading
        title="Monitoring Dashboard"
        description="Realtime overview of orchestration system status."
      />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Key Metrics</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 @5xl/main:grid-cols-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="@container/card cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-400 hover:bg-white/80 dark:hover:bg-white/10"
              onClick={() => handleCardClick(stat.label)}
            >
              <CardHeader>
                <CardDescription className="text-md text-[#2d2d2d] mb-2">
                  {stat.label}
                </CardDescription>

                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stat.value}
                </CardTitle>
              </CardHeader>

              <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
                {stat.footer}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
