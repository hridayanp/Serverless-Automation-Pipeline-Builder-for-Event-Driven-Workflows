/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setProjects } from '@/redux/slices/workflowSlice';

import { ProjectWizard } from '@/components/Forms/WorkflowManager/ProjectWizard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/Table/Table';
import { SectionHeading } from '@/components/Headings/SectionHeading';

  
import {
  deleteProjects,
  getProjects,
  getProjectEnvironments,
} from '@/api/ApiService';
import toast from 'react-hot-toast';
import { Eye, Plus, Trash2, Terminal, Code2, Settings2, FileCode2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { ConfirmDeleteDialog } from '@/components/Dialogs/ConfirmDeleteDialog';

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
    if (projects.length === 0) return [];

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

  return (
    <div className="grid gap-6 p-4 max-w-7xl mx-auto lg:px-6">
      <div className="flex justify-between items-center">
        <SectionHeading
          title="Projects Management"
          description="Overview of added projects and their related information."
        />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>

      <DataTable
        pagination
        toolbar
        searchBy="name"
        data={projects}
        columns={columns}
      />

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
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh] p-0 border-none shadow-2xl">
          <div className="bg-slate-900 text-white p-6 rounded-t-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Terminal className="w-6 h-6 text-primary/70" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                    Environment Details
                  </DialogTitle>
                  <p className="text-slate-400 text-sm mt-1">
                    Project: <span className="text-primary/70 font-medium">{currentProject?.name}</span>
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 bg-slate-50">
            {loadingEnv ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Fetching environments...</p>
              </div>
            ) : selectedEnvironments.length > 0 ? (
              <div className="space-y-6">
                {selectedEnvironments.map((env) => (
                  <div key={env.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-slate-400" />
                        <h3 className="font-bold text-slate-800 text-lg capitalize">{env.env_name}</h3>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">
                          {env.language}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs text-slate-500">
                        ID: {env.id.slice(0, 8)}...
                      </Badge>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                              <Code2 className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</p>
                              <p className="text-slate-700 font-medium">{env.method}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                              <FileCode2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Config File</p>
                              <p className="text-slate-700 font-medium">{env.file_name}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-6 bg-slate-100" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            Requirements
                            <span className="text-xs font-normal text-slate-400">({env.file_name})</span>
                          </p>
                        </div>
                        <div className="relative group">
                          <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono leading-relaxed overflow-x-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                            {decodeBase64(env.file_content)}
                          </pre>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge className="bg-slate-800 text-slate-400 border-slate-700">Read Only</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">No environments found for this project.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
