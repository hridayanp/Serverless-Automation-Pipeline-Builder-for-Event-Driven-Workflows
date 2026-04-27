/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setProjects } from '@/redux/slices/workflowSlice';

import { ProjectWizard } from '@/components/Forms/WorkflowManager/ProjectWizard';
import { PageLayout } from '@/components/Layout/PageLayout';

import type { ColumnDef } from '@tanstack/react-table';
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description?: string;
  script_folder?: string;
  [key: string]: any; // preserves dynamic column generation from original
}

interface Environment {
  id: string;
  env_name: string;
  language: string;
  method: string;
  file_name: string;
  file_content: string;
}

// ─── Helper — identical to original ──────────────────────────────────────────

const decodeBase64 = (str: string): string => {
  if (!str) return '';
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  } catch (e) {
    console.error('Decoding error:', e);
    return 'Error decoding content';
  }
};

// ─── ProjectsPage ─────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const { projects } = useSelector((state: any) => state.workflow);

  // ── State — identical to original ─────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [envDialogOpen, setEnvDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [selectedEnvironments, setSelectedEnvironments] = useState<Environment[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch — identical to original ─────────────────────────────────────────

  // ✅ Single fetch function — correct shape: res.data.data
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
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
      setIsLoading(false);
    }
  }, [dispatch]);

  // ✅ Single useEffect — no duplicate calls
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Handlers — identical to original ──────────────────────────────────────

  const handleWizardSuccess = () => {
    setDialogOpen(false);
    fetchProjects();
  };

  const handleViewEnvironments = async (project: Project) => {
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

  const handleDeleteClick = (row: Project) => {
    setProjectToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    const payload = { project_id: projectToDelete.id };

    try {
      const res = await deleteProjects(payload);
      if (res?.status === 200 && res.data.status === 'SUCCESS') {
        toast.success(
          res.data.message ||
            'Project and associated environments deleted successfully',
        );
        fetchProjects();
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

  // ── Table columns — identical to original ─────────────────────────────────

  const columns: ColumnDef<Project>[] = useMemo(() => {
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

    const actionColumn: ColumnDef<Project> = {
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

  // ── Stats — identical to original ─────────────────────────────────────────

  const stats = useMemo(() => {
    const projectList = Array.isArray(projects) ? projects : [];

    const uniqueFolders = new Set(projectList.map((p: Project) => p.script_folder)).size;
    const documented = projectList.filter(
      (p: Project) => p.description && p.description.length > 0,
    ).length;
    const avgNameLength =
      projectList.length > 0
        ? (
            projectList.reduce(
              (acc: number, p: Project) => acc + (p.name?.length || 0),
              0,
            ) / projectList.length
          ).toFixed(0)
        : '0';

    return [
      {
        label: 'Total Projects',
        getValue: (d: any[]) => d.length,
        icon: LayoutGrid,
        color: 'primary',
      },
      {
        label: 'Unique Folders',
        // Computed above — passed through closure, consistent with original
        getValue: (_d: any[]) => uniqueFolders,
        icon: Activity,
        color: 'secondary',
      },
      {
        label: 'Documented',
        getValue: (_d: any[]) => documented,
        icon: ShieldCheck,
        color: 'tertiary',
      },
      {
        label: 'Avg Name Meta',
        getValue: (_d: any[]) => `${avgNameLength}ch`,
        icon: Terminal,
        color: 'primary',
      },
    ];
  }, [projects]);

  // ── Detail dialog tab: Project Details — identical to original ────────────

  const renderProjectDetailsTab = (project: Project) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-white flex items-center gap-3">
          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
            <Code2 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-primary text-lg">Identity & Context</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Internal UUID
            </p>
            <p className="font-mono text-sm text-primary bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 select-all">
              {project.id}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Display Name
            </p>
            <p className="text-primary font-bold text-lg">{project.name}</p>
          </div>
        </div>
        <Separator className="mx-6 w-auto" />
        <div className="p-6">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Project Description
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            {project.description ||
              'No description provided for this orchestration pipeline. This project is configured to handle event-driven workloads with scalable infrastructure.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Created At', value: new Date().toLocaleDateString(), icon: Activity },
          { label: 'Status', value: 'Active', icon: ShieldCheck },
          { label: 'Integrations', value: 'AWS Lambda', icon: Settings2 },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-3"
          >
            <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                {item.label}
              </p>
              <p className="text-sm font-bold text-primary">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Detail dialog tab: Environment Config — identical to original ─────────
  // Note: reads from `loadingEnv` and `selectedEnvironments` in closure,
  // exactly as the original's TabsContent did with the same state variables.

  const renderEnvironmentTab = (_project: Project) => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  const projectList = Array.isArray(projects) ? projects : [];

  return (
    <PageLayout<Project>
      // ── Page meta ──────────────────────────────────────────────────────────
      title="Projects Hub"
      subtitle="Orchestrate your serverless infrastructure and deployment pipelines."
      defaultView="card"
      // ── Data ───────────────────────────────────────────────────────────────
      data={projectList}
      isLoading={isLoading}
      loadingLabel="Syncing Dashboard"
      searchBy="name"
      // ── Stats ──────────────────────────────────────────────────────────────
      stats={stats}
      // ── Table columns (custom — includes original action column with exact
      //   hover styles, tooltip text, and click handlers) ────────────────────
      columns={columns}
      // ── Card config ────────────────────────────────────────────────────────
      cardConfig={{
        titleKey: 'name',
        subtitleKey: 'id',           // renders as "UUID: abc123..."
        descriptionKey: 'description',
        descriptionFallback:
          'Enterprise-grade serverless orchestration pipeline designed for event-driven workflows and scalable automation.',
        statusBadge: () => ({ label: 'Stable' }),
        metaBadge: () => (
          <Badge
            variant="outline"
            className="rounded-lg text-[9px] font-bold py-0.5 border-neutral-200 text-muted-foreground"
          >
            Created {new Date().toLocaleDateString()}
          </Badge>
        ),
      }}
      // ── Card row actions (hover buttons — same behaviour as original) ───────
      // externalDeleteDialog is provided, so these onClick handlers are called
      // directly without PageLayout intercepting the danger action.
      rowActions={[
        {
          label: 'View environment details',
          icon: Eye,
          variant: 'default',
          onClick: handleViewEnvironments,
        },
        {
          label: 'Delete project',
          icon: Trash2,
          variant: 'danger',
          onClick: handleDeleteClick, // opens external delete dialog
        },
      ]}
      // ── External delete dialog — preserves original handleConfirmDelete ─────
      // with its own try/catch, toast messages, and fetchProjects() call.
      externalDeleteDialog={{
        open: deleteDialogOpen,
        onOpenChange: setDeleteDialogOpen,
        onConfirm: handleConfirmDelete,
        title: 'Delete Project?',
        description:
          'Are you sure you want to delete this project and all its associated environments, tasks, and workflows? This action cannot be undone.',
      }}
      // ── Header action ──────────────────────────────────────────────────────
      actions={[
        {
          label: 'New Project',
          icon: Plus,
          onClick: () => setDialogOpen(true),
        },
      ]}
      // ── Form dialog (New Project) ──────────────────────────────────────────
      formDialog={{
        open: dialogOpen,
        onOpenChange: setDialogOpen,
        title: 'New Project',
        maxWidth: 'max-w-3xl',
        children: (
          <ProjectWizard
            onSuccess={handleWizardSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        ),
      }}
      // ── Detail dialog (View Environments) ─────────────────────────────────
      // Externally controlled: envDialogOpen / setEnvDialogOpen are owned here
      // so that handleViewEnvironments can set currentProject + fire the API
      // call before/during the dialog opening — identical to original behaviour.
      detailDialogRow={currentProject}
      detailDialog={
        currentProject
          ? {
              open: envDialogOpen,
              onOpenChange: setEnvDialogOpen,
              title: () => 'Project Insights',
              subtitle: (row: Project) => `Managing: ${row.name}`,
              icon: LayoutGrid,
              tabs: [
                {
                  value: 'project',
                  label: 'Project Details',
                  icon: Code2,
                  render: renderProjectDetailsTab,
                },
                {
                  value: 'environment',
                  label: 'Environment Config',
                  icon: Settings2,
                  render: renderEnvironmentTab,
                },
              ],
            }
          : undefined
      }
    />
  );
}