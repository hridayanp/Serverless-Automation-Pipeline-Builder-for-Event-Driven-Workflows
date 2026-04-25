/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setProjects } from '@/redux/slices/workflowSlice';

import { ProjectWizard } from '@/components/Forms/WorkflowManager/ProjectWizard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/Table/Table';

import {
  deleteProjects,
  getProjects,
  getProjectEnvironments,
} from '@/api/ApiService';
import toast from 'react-hot-toast';
import {
  Eye,
  Plus,
  Trash2,
  Terminal,
  Code2,
  Settings2,
  FileCode2,
  LayoutGrid,
  Activity,
  ShieldCheck,
 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { ConfirmDeleteDialog } from '@/components/Dialogs/ConfirmDeleteDialog';
import { ViewSwitcher } from '@/components/Layout/ViewSwitcher';
import { SegmentedTabs } from '@/components/Layout/SegmentedTabs';

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const { projects } = useSelector((state: any) => state.workflow);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [envDialogOpen, setEnvDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [selectedEnvironments, setSelectedEnvironments] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [_, setIsSubmitting] = useState(false);

  // Ref-wrapped fetchProjects to preserve identity
  const fetchProjectsRef = useRef(async () => {
    try {
      setIsSubmitting(true);
      const res = await getProjects();
      const apiData = res?.data;

      if (apiData?.status === 'SUCCESS' && Array.isArray(apiData?.data)) {
        dispatch(setProjects(apiData.data));
      } else {
        toast.error('No projects found');
        dispatch(setProjects([]));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch projects');
      dispatch(setProjects([]));
    } finally {
      setIsSubmitting(false);
    }
  });

  // Only fetch if Redux store is empty
  useEffect(() => {
    fetchProjectsRef.current();
  }, []);

  const handleWizardSuccess = () => {
    setDialogOpen(false);
    fetchProjectsRef.current();
  };

  const handleViewEnvironments = async (project: any) => {
    setCurrentProject(project);
    setEnvDialogOpen(true);
    setLoadingEnv(true);
    setSelectedEnvironments([]);

    try {
      const res = await getProjectEnvironments({ projectId: project.id });
      const apiData = res?.data;

      if (apiData?.status === 'SUCCESS' && Array.isArray(apiData?.data)) {
        setSelectedEnvironments(apiData.data);
      } else {
        toast.error('No environments found for this project');
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
      toast.error('Failed to fetch environment details');
    } finally {
      setLoadingEnv(false);
    }
  };

  const handleDeleteClick = (row: any) => {
    setProjectToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    const payload = {
      project_id: projectToDelete.id,
    };

    try {
      const res = await deleteProjects(payload);
      if (res?.status === 200 && res.data.status === 'SUCCESS') {
        toast.success(
          res.data.message ||
            'Project and associated environments deleted successfully',
        );
        fetchProjectsRef.current();
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch (e) {
      console.error('Delete error:', e);
      toast.error('Failed to delete project');
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const decodeBase64 = (str: string) => {
    if (!str) return '';
    try {
      return decodeURIComponent(
        atob(str)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (e) {
      console.error('Decoding error:', e);
      return 'Error decoding content';
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => {
    if (!projects || projects.length === 0 || !projects[0]) return [];

    const baseColumns = Object.keys(projects[0])
      .filter((key) => key !== 'id')
      .map((key) => ({
        accessorKey: key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        cell: ({ row }: any) => {
          const value = row.getValue(key);
          if (typeof value === 'object') {
            return (
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-w-75 overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            );
          }
          return <span>{value}</span>;
        },
      }));

    const actionColumn: ColumnDef<any> = {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-center items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => handleViewEnvironments(row.original)}
                >
                  <Eye size={18} className="text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>View environment details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer p-2 hover:bg-red-50 rounded-full transition-colors"
                  onClick={() => handleDeleteClick(row.original)}
                >
                  <Trash2 size={18} className="text-red-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    };

    return [...baseColumns, actionColumn];
  }, [projects]);

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isLoading, setIsLoading] = useState(true);

  // Stats calculation
  const stats = useMemo(() => {
    const projectList = Array.isArray(projects) ? projects : [];
    
    // Unique folders
    const uniqueFolders = new Set(projectList.map(p => p.script_folder)).size;
    
    // Documentation coverage
    const documented = projectList.filter(p => p.description && p.description.length > 0).length;
    
    // Name complexity (avg length)
    const avgNameLength = projectList.length > 0 
      ? (projectList.reduce((acc, p) => acc + (p.name?.length || 0), 0) / projectList.length).toFixed(0)
      : '0';

    return [
      { label: 'Total Projects', value: projectList.length, icon: LayoutGrid, color: 'primary' },
      { label: 'Unique Folders', value: uniqueFolders, icon: Activity, color: 'secondary' },
      { label: 'Documented', value: documented, icon: ShieldCheck, color: 'tertiary' },
      { label: 'Avg Name Meta', value: `${avgNameLength}ch`, icon: Terminal, color: 'primary' }
    ];
  }, [projects]);

  const hasFetched = useRef(false);

  const fetchProjects = useCallback(async () => {
    // Only set loading if it's the first fetch to avoid flickering on re-renders
    if (!hasFetched.current) setIsLoading(true);
    
    try {
      const response = await getProjects();
      if (response && response.data) {
        dispatch(setProjects(response.data));
      } else {
        dispatch(setProjects([]));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      dispatch(setProjects([]));
    } finally {
      setIsLoading(false);
      hasFetched.current = true;
    }
  }, [dispatch]);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchProjects();
    }
  }, [fetchProjects]);

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

  const projectList = Array.isArray(projects) ? projects : [];

  return (
    <div className="min-h-screen bg-[#fdfdfb] p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Dynamic Header & Overview */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#1a2c20]">
              Projects Hub
            </h1>
            <p className="text-muted-foreground text-sm">
              Orchestrate your serverless infrastructure and deployment pipelines.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
             {viewMode === 'table' && (
               <>
                 <Separator orientation="vertical" className="h-8 mx-1" />
                 <Button 
                   onClick={() => setDialogOpen(true)}
                   className="rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 font-bold text-xs uppercase tracking-widest px-5"
                 >
                   <Plus className="mr-2 h-4 w-4" /> New Project
                 </Button>
               </>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4 transition-colors">
              <div className={`p-2.5 rounded-lg bg-${stat.color}/5 text-${stat.color} transition-all duration-300`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-[#1a2c20]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content View Switcher */}
      <div className="space-y-6">
        {viewMode === 'table' ? (
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-2 overflow-hidden">
             <DataTable
              pagination
              toolbar
              searchBy="name"
              data={projectList}
              columns={columns}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projectList.map((project: any) => (
              <div 
                key={project.id} 
                className="bg-white rounded-xl border border-neutral-100 p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group flex flex-col justify-between min-h-[220px]"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-bold text-muted-foreground/60 uppercase tracking-tighter">
                        UUID: {project.id.slice(0, 13)}...
                      </span>
                      <h3 className="text-lg font-bold text-[#1a2c20] group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/5 text-muted-foreground hover:text-primary" onClick={() => handleViewEnvironments(project)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-500" onClick={() => handleDeleteClick(project)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {project.description || 'Enterprise-grade serverless orchestration pipeline designed for event-driven workflows and scalable automation.'}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-neutral-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stable</span>
                  </div>
                  <Badge variant="outline" className="rounded-lg text-[9px] font-bold py-0.5 border-neutral-200 text-muted-foreground">
                    Created {new Date().toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            ))}
            
            {/* Minimalist Add Card */}
            <div 
              onClick={() => setDialogOpen(true)}
              className="border-2 border-dashed border-neutral-100 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all group min-h-[220px]"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#1a2c20]">Add New Project</p>
                <p className="text-[10px] text-muted-foreground font-medium">Initialize new project</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Project?"
        description="Are you sure you want to delete this project and all its associated environments, tasks, and workflows? This action cannot be undone."
      />

      {/* New Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <ProjectWizard
            onSuccess={handleWizardSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Environments Dialog */}
      <Dialog open={envDialogOpen} onOpenChange={setEnvDialogOpen}>
        <DialogContent className="max-w-5xl overflow-y-auto max-h-[90vh] p-0 border-none shadow-2xl bg-background [&>button]:text-white">
          <div className="bg-primary text-white p-6 rounded-t-xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <LayoutGrid className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                    Project Insights
                  </DialogTitle>
                  <p className="text-white/70 text-sm mt-1">
                    Managing: <span className="text-white font-bold">{currentProject?.name}</span>
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <Tabs defaultValue="project" className="w-full">
            <div className="px-6 pb-4 border-b border-border flex justify-center">
              <SegmentedTabs 
                options={[
                  { value: 'project', label: 'Project Details', icon: Code2 },
                  { value: 'environment', label: 'Environment Config', icon: Settings2 }
                ]}
              />
            </div>

            <div className="p-6 bg-background min-h-[500px]">
              <TabsContent value="project" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-white flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                      <Code2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-primary text-lg">Identity & Context</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Internal UUID</p>
                      <p className="font-mono text-sm text-primary bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 select-all">
                        {currentProject?.id}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Display Name</p>
                      <p className="text-primary font-bold text-lg">{currentProject?.name}</p>
                    </div>
                  </div>
                  <Separator className="mx-6 w-auto" />
                  <div className="p-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Project Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                      {currentProject?.description || 'No description provided for this orchestration pipeline. This project is configured to handle event-driven workloads with scalable infrastructure.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   {[
                     { label: 'Created At', value: new Date().toLocaleDateString(), icon: Activity },
                     { label: 'Status', value: 'Active', icon: ShieldCheck },
                     { label: 'Integrations', value: 'AWS Lambda', icon: Settings2 }
                   ].map((item, i) => (
                     <div key={i} className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-3">
                       <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
                         <item.icon className="w-4 h-4" />
                       </div>
                       <div>
                         <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{item.label}</p>
                         <p className="text-sm font-bold text-primary">{item.value}</p>
                       </div>
                     </div>
                   ))}
                </div>
              </TabsContent>

              <TabsContent value="environment" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {loadingEnv ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin" />
                    <p className="text-primary font-medium">Fetching environments...</p>
                  </div>
                ) : selectedEnvironments.length > 0 ? (
                  <div className="space-y-6">
                    {selectedEnvironments.map((env) => (
                      <div
                        key={env.id}
                        className="bg-white rounded-xl shadow-md border border-border overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white">
                          <div className="flex items-center gap-3">
                            <Settings2 className="w-5 h-5 text-secondary" />
                            <h3 className="font-bold text-primary text-lg capitalize">
                              {env.env_name}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                            >
                              {env.language}
                            </Badge>
                          </div>
                          <Badge
                            variant="outline"
                            className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors cursor-default"
                          >
                            ID: {env.id.slice(0, 8)}...
                          </Badge>
                        </div>

                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                                  <Code2 className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Method
                                  </p>
                                  <p className="text-primary font-semibold">{env.method}</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary/5 rounded-lg border border-secondary/10">
                                  <FileCode2 className="w-4 h-4 text-secondary" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Config File
                                  </p>
                                  <p className="text-primary font-semibold">{env.file_name}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-6" />

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                                <Terminal className="w-4 h-4" />
                                Requirements Contents
                                <span className="text-[10px] font-normal text-muted-foreground normal-case">
                                  ({env.file_name})
                                </span>
                              </p>
                            </div>
                            <div className="relative group">
                              <pre className="bg-[#1a2c20] text-[#e8f3ec] p-5 rounded-xl text-sm font-mono leading-relaxed overflow-x-auto max-h-[350px] border border-white/5 thin-scrollbar shadow-inner">
                                {decodeBase64(env.file_content)}
                              </pre>
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Badge className="bg-primary/80 text-white border-white/20 backdrop-blur-sm">
                                  Read Only
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-border shadow-inner">
                    <FileCode2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-primary">No Environments Found</h3>
                    <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
                      This project has no execution environments configured yet.
                    </p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
