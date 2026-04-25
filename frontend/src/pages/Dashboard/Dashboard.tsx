/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import {
  LayoutGrid,
  Activity,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getProjects,
  getTasks,
  getWorkflowsForProject,
  getWorkflowJobs,
} from '@/api/ApiService';
import { setProjects } from '@/redux/slices/workflowSlice';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { projects } = useSelector((state: any) => state.workflow);

  const [isLoading, setIsLoading] = useState(true);
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [workflowsData, setWorkflowsData] = useState<any[]>([]);
  const [jobsData, setJobsData] = useState<any[]>([]);

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
      case 'Live Executions':
        navigate('/workflow/details');
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
      const apiData = res?.data;
      const data =
        apiData?.status === 'SUCCESS'
          ? apiData.data
          : Array.isArray(apiData)
          ? apiData
          : [];
      setTasksData(Array.isArray(data) ? data : []);
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
      const apiData = res?.data;
      const data =
        apiData?.status === 'SUCCESS'
          ? apiData.data
          : Array.isArray(apiData)
          ? apiData
          : [];
      setWorkflowsData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch workflows:', e);
      setWorkflowsData([]);
    }
  };

  /* -------------------------------
     Fetch Jobs (Executions)
  --------------------------------*/
  const fetchJobs = async (projectId: string) => {
    try {
      const res = await getWorkflowJobs({ project_id: projectId });
      const apiData = res?.data;
      const data =
        apiData?.status === 'SUCCESS'
          ? apiData.data
          : Array.isArray(apiData)
          ? apiData
          : [];
      setJobsData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch jobs:', e);
      setJobsData([]);
    }
  };

  /* -------------------------------
     Load Dashboard Data
  --------------------------------*/
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      let projectList = projects;

      if (!projectList || projectList.length === 0) {
        const res = await getProjects();
        const apiData = res?.data;

        if (apiData?.status === 'SUCCESS' && Array.isArray(apiData?.data)) {
          dispatch(setProjects(apiData.data));
          projectList = apiData.data;
        } else if (Array.isArray(apiData)) {
          dispatch(setProjects(apiData));
          projectList = apiData;
        } else {
          toast.error('No active projects found. Please initialize a project.');
          dispatch(setProjects([]));
          return;
        }
      }

      const firstProjectId = projectList[0]?.id;
      if (!firstProjectId) {
        toast.error('Project identity mismatch. Please refresh.');
        return;
      }

      await Promise.all([
        fetchTasks(firstProjectId),
        fetchWorkflows(firstProjectId),
        fetchJobs(firstProjectId),
      ]);
    } catch (err) {
      console.error('Dashboard load error:', err);
      toast.error('A system sync error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* -------------------------------
     Stats Definition
  --------------------------------*/
  const stats = [
    {
      label: 'Total Projects',
      value: projects?.length || 0,
      icon: LayoutGrid,
      color: '#1a2c20',
      accentColor: '#d4edda',
      description:
        'Isolated namespaces grouping your cloud resources, tasks, and automation goals into deployable units.',
      trend: 'All systems nominal',
      route: '/workflow/projects',
    },
    {
      label: 'Total Tasks',
      value: tasksData?.length || 0,
      icon: Activity,
      color: '#2d5a3d',
      accentColor: '#c8e6c9',
      description:
        'Discrete serverless functions registered under your project — each one a deployable unit of business logic.',
      trend: 'Ready for dispatch',
      route: '/workflow/tasks',
    },
    {
      label: 'Total Workflows',
      value: workflowsData?.length || 0,
      icon: ShieldCheck,
      color: '#1b4332',
      accentColor: '#b7dfc8',
      description:
        'Orchestrated execution chains linking tasks together — your automation logic running end-to-end on schedule or trigger.',
      trend: 'Pipelines intact',
      route: '/workflow/details',
    },
    {
      label: 'Live Executions',
      value: jobsData?.length || 0,
      icon: Zap,
      color: '#0d3320',
      accentColor: '#a8d5b5',
      description:
        'Jobs currently running or queued in real time — each representing an active invocation of your workflow engine.',
      trend: 'Monitoring active',
      route: '/workflow/details',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/10 rounded-full" />
          <div className="w-16 h-16 border-4 border-t-primary rounded-full animate-spin absolute top-0 left-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-xl font-bold text-primary tracking-tight">
            Syncing Dashboard
          </p>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            Accessing Secure Infrastructure
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#f7f8f5] p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1a2c20]/40 mb-2">
            Orchestration Console
          </p>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-[#1a2c20] leading-none">
            System Overview
          </h1>
          <p className="mt-3 text-sm text-[#1a2c20]/50 font-medium max-w-md leading-relaxed">
            Your serverless infrastructure at a glance — projects, tasks,
            workflows, and live execution state, all in one place.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              Live
            </span>
          </div>
          <p className="text-lg font-bold text-[#1a2c20] tabular-nums">{timeString}</p>
          <p className="text-[11px] text-[#1a2c20]/40 font-medium">{dateString}</p>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-4 mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1a2c20]/30 whitespace-nowrap">
          Key Metrics
        </p>
        <div className="flex-1 h-px bg-[#1a2c20]/8" />
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a2c20]/30 uppercase tracking-widest">
          <TrendingUp className="w-3 h-3" />
          <span>4 Signals</span>
        </div>
      </div>

      {/* ── Stat Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            onClick={() => handleCardClick(stat.label)}
            className="group relative bg-white rounded-2xl border border-neutral-100 p-7 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#1a2c20]/8 hover:-translate-y-0.5 hover:border-[#1a2c20]/15"
          >
            {/* Background accent blob */}
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.06] group-hover:opacity-[0.10] transition-opacity duration-500 pointer-events-none"
              style={{ backgroundColor: stat.color }}
            />

            {/* Top row: icon + arrow */}
            <div className="flex items-start justify-between mb-6">
              <div
                className="flex items-center justify-center w-11 h-11 rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: stat.accentColor }}
              >
                <stat.icon
                  className="w-5 h-5"
                  style={{ color: stat.color }}
                  strokeWidth={2.2}
                />
              </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                <span className="text-[10px] font-bold text-[#1a2c20]/40 uppercase tracking-wider">
                  Explore
                </span>
                <ArrowUpRight
                  className="w-4 h-4 text-[#1a2c20]/40"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            {/* Label */}
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a2c20]/40 mb-2">
              {stat.label}
            </p>

            {/* Value */}
            <div className="flex items-baseline gap-3 mb-4">
              <span
                className="text-6xl font-black tracking-tighter leading-none tabular-nums"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
              <div className="flex items-center gap-1 pb-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  {stat.trend}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-[#1a2c20]/50 leading-relaxed font-medium">
              {stat.description}
            </p>

            {/* Bottom bar */}
            <div
              className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl"
              style={{ backgroundColor: stat.color, opacity: 0.3 }}
            />
          </div>
        ))}
      </div>

      {/* ── Footer note ── */}
      <p className="mt-8 text-center text-[10px] text-[#1a2c20]/25 font-medium uppercase tracking-widest">
        Data reflects the first active project · Click any card to drill down
      </p>
    </div>
  );
}