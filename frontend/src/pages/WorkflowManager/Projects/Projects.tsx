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
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh] p-0 border-none shadow-2xl bg-background [&>button]:text-white">
          <div className="bg-primary text-white p-6 rounded-t-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Terminal className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                    Environment Details
                  </DialogTitle>
                  <p className="text-white/70 text-sm mt-1">
                    Project:{' '}
                    <span className="text-white font-bold">{currentProject?.name}</span>
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 bg-background">
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
