/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useRef, useState } from 'react';
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

  const fetchTasks = async (projectId: string) => {
    try {
      const res = await getTasks({ project_id: projectId });
      if (res?.status === 200 && Array.isArray(res.data)) {
        setTasksData(res.data);
      } else {
        setTasksData([]);
      }
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    }
  };

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
      console.error('Error fetching workflows:', e);
    }
  };

  const fetchAllData = useRef(async () => {
    try {
      setLoading(true);

      if (!projects || projects.length === 0) {
        const res = await getProjects();
        const fetched = res?.data;

        if (Array.isArray(fetched) && fetched.length > 0) {
          dispatch(setProjects(fetched));
          const firstId = String(fetched[0].id);
          await Promise.all([fetchTasks(firstId), fetchWorkflows(firstId)]);
        } else {
          toast.error('No projects found');
          dispatch(setProjects([]));
        }
      } else {
        const firstId = String(projects[0].id);
        await Promise.all([fetchTasks(firstId), fetchWorkflows(firstId)]);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    fetchAllData.current();
  }, []);

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
      value: 0,
      footer:
        'This shows how many workflows actually ran — we’ll show this soon!',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent border-blue-600 rounded-full animate-spin" />
          <p className="text-lg font-medium text-gray-700">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-4 max-w-7xl mx-auto lg:px-6">
      <SectionHeading
        title="Monitoring Dashboard"
        description="Realtime overview of orchestration system status."
      />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Key Metrics</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 @5xl/main:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
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
