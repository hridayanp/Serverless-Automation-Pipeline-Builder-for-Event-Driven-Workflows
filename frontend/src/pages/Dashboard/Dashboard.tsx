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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getProjects, 
  getTasks, 
  getWorkflowsForProject,
  getWorkflowJobs 
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
        navigate('/workflow/details'); // Or specialized logs page
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
      const data = apiData?.status === 'SUCCESS' ? apiData.data : (Array.isArray(apiData) ? apiData : []);
      const finalData = Array.isArray(data) ? data : [];
      setTasksData(finalData);
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
      const data = apiData?.status === 'SUCCESS' ? apiData.data : (Array.isArray(apiData) ? apiData : []);
      const finalData = Array.isArray(data) ? data : [];
      setWorkflowsData(finalData);
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
      const data = apiData?.status === 'SUCCESS' ? apiData.data : (Array.isArray(apiData) ? apiData : []);
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

      /* Fetch projects if redux empty */
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
      color: 'primary',
      description: 'Collections organizing your cloud goals.'
    },
    {
      label: 'Total Tasks',
      value: tasksData?.length || 0,
      icon: Activity,
      color: 'secondary',
      description: 'Individual units of cloud automation.'
    },
    {
      label: 'Total Workflows',
      value: workflowsData?.length || 0,
      icon: ShieldCheck,
      color: 'tertiary',
      description: 'Automated chains of execution.'
    },
    {
      label: 'Live Executions',
      value: jobsData?.length || 0,
      icon: Zap,
      color: 'primary',
      description: 'Active automation runs in progress.'
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
          <p className="text-xl font-bold text-primary tracking-tight">Syncing Dashboard</p>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Accessing Secure Infrastructure</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfb] p-6 lg:p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a2c20]">
          System Monitoring
        </h1>
        <p className="text-muted-foreground text-sm">
          Real-time overview of your serverless orchestration ecosystem.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#1a2c20]/40">Key Metrics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              onClick={() => handleCardClick(stat.label)}
              className="bg-white p-7 rounded-xl border border-neutral-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group cursor-pointer flex flex-col gap-6"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl bg-${stat.color}/5 text-${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-[#1a2c20] tracking-tight">{stat.value}</p>
                  <span className="text-xs font-medium text-emerald-600">+0%</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
