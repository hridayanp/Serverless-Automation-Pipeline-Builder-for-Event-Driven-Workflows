/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Play,
  Eye,
  GitBranch,
  CheckCircle2,
  LayoutGrid,
  ListTree,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import WorkflowViewer from './View/WorkflowViewer';
import {
  getWorkflowsForProject,
  getProjects,
  executeWorkflow,
  deleteWorkflow as deleteWorkflowApi,
} from '@/api/ApiService';
import {
  setProjects as setProjectState,
  setTasks,
} from '@/redux/slices/workflowSlice';
import { PageLayout } from '@/components/Layout/PageLayout';
import type {
  StatConfig,
  RowAction,
  CardConfig,
} from '@/components/Layout/PageLayout';

export default function Workflow() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { projects } = useSelector((state: any) => state.workflow);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [isCardViewDialogOpen, setIsCardViewDialogOpen] = useState(false);
  const [cardViewWorkflow, setCardViewWorkflow] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDeleteId, setWorkflowToDeleteId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    dispatch(setTasks([]));
  }, []);

  // ── Fetch projects (ref-wrapped, identical to original) ───────────────────
  const fetchProjectsRef = useRef(async () => {
    try {
      const res = await getProjects();
      const projectData = res?.data?.data || res?.data;

      if (Array.isArray(projectData) && projectData.length > 0) {
        dispatch(setProjectState(projectData));
        const firstProjectId = String(projectData[0].id);
        setSelectedProjectId(firstProjectId);
        fetchWorkflows(firstProjectId);
      }
    } catch (e) {
      console.error('Error fetching projects:', e);
      toast.error('Failed to load projects');
    }
  });

  useEffect(() => {
    fetchProjectsRef.current();
  }, []);

  const fetchWorkflows = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await getWorkflowsForProject({ project_id: projectId });
      const workflowsData = res?.data?.data;
      if (res?.status === 200 && Array.isArray(workflowsData)) {
        setWorkflows(workflowsData);
      } else {
        setWorkflows([]);
        toast.error('No workflows found');
      }
    } catch (e) {
      console.error('Error fetching workflows:', e);
      toast.error('Error fetching workflows');
    } finally {
      setLoading(false);
    }
  };

  // ── Identical helpers from original ───────────────────────────────────────

  const countTasks = (task: any): number => {
    let count = 1;
    if (task.children) {
      for (const triggerKey of Object.keys(task.children)) {
        const childTasks = task.children[triggerKey];
        for (const child of childTasks) {
          count += countTasks(child);
        }
      }
    }
    return count;
  };

  const renderTaskTreeLimited = (
    task: any,
    depth = 0,
    limit = 3,
    counter = { count: 0 },
  ) => {
    if (counter.count >= limit) return null;
    counter.count++;

    return (
      <ul className="ml-4 border-l pl-4 space-y-2 text-xs text-muted-foreground">
        <li>
          <div className="font-medium text-foreground">{task.identifier}</div>
          <div className="text-[11px] italic">{task.description}</div>

          {task.children &&
            Object.entries(task.children).map(
              ([triggerType, childTasks]: any) => (
                <div key={triggerType} className="mt-2">
                  <div className="text-[10px] font-semibold uppercase text-foreground">
                    {triggerType}
                  </div>
                  <div className="space-y-1">
                    {childTasks.map((child: any, i: number) => (
                      <div key={i}>
                        {renderTaskTreeLimited(
                          child,
                          depth + 1,
                          limit,
                          counter,
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
        </li>
      </ul>
    );
  };

  // ── Handlers (identical to original) ──────────────────────────────────────

  const handleExecute = async (workflow: any) => {
    try {
      setLoading(true);
      const res = await executeWorkflow({ workflow_id: workflow.id });
      if (res?.status === 200) {
        toast.success('Workflow execution started!');
        // navigate('/workflow/jobs', {
        //   state: {
        //     projectId: selectedProjectId,
        //     workflowName: workflow.workflow_name,
        //   },
        // });
      } else {
        toast.error('Failed to start execution');
      }
    } catch (e) {
      console.error('Execution Error:', e);
      toast.error('Error starting execution');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (workflowId: string) => {
    setWorkflowToDeleteId(workflowId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!workflowToDeleteId) return;
    try {
      setLoading(true);
      const res = await deleteWorkflowApi({ workflow_id: workflowToDeleteId });
      if (res?.status === 200) {
        toast.success('Workflow deleted successfully');
        fetchWorkflows(selectedProjectId);
      } else {
        toast.error('Failed to delete workflow');
      }
    } catch (e) {
      console.error('Delete Error:', e);
      toast.error('Error deleting workflow');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setWorkflowToDeleteId(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo<StatConfig[]>(() => {
    const totalTasks = workflows.reduce(
      (acc, w) => acc + (w.tasks ? countTasks(w.tasks) : 0),
      0,
    );
    const withScheduler = workflows.filter(
      (w) => w.scheduler_detail && Object.keys(w.scheduler_detail).length > 0,
    ).length;

    return [
      {
        label: 'Total Workflows',
        getValue: (d) => d.length,
        icon: GitBranch,
        color: 'primary',
      },
      {
        label: 'Total Tasks',
        getValue: () => totalTasks,
        icon: ListTree,
        color: 'secondary',
      },
      {
        label: 'Scheduled',
        getValue: () => withScheduler,
        icon: CheckCircle2,
        color: 'tertiary',
      },
      {
        label: 'Projects',
        getValue: () => projects.length,
        icon: LayoutGrid,
        color: 'primary',
      },
    ];
  }, [workflows, projects]);

  // ── Table columns (identical cell renderers from original) ────────────────

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const baseColumns =
      workflows.length > 0
        ? Object.keys(workflows[0])
            .filter((key) => key !== 'tasks' && key !== 'id')
            .map((key) => ({
              accessorKey: key,
              header: key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase()),
              cell: ({ row }: any) => {
                const value = row.getValue(key);

                if (key === 'project_id' && typeof value === 'string') {
                  return (
                    <span className="font-mono text-xs text-muted-foreground">
                      {value.slice(0, 4)}...{value.slice(-4)}
                    </span>
                  );
                }

                if (
                  key === 'scheduler_detail' &&
                  typeof value === 'object' &&
                  value !== null
                ) {
                  return (
                    <div className="p-2 rounded bg-muted text-sm text-foreground space-y-1">
                      <div>
                        <span className="font-medium">Cron:</span> {value.cron}
                      </div>
                      <div>
                        <span className="font-medium">Detail:</span>{' '}
                        {value.detail}
                      </div>
                    </div>
                  );
                }

                if (typeof value === 'object' && value !== null) {
                  return (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {Object.entries(value).map(([subKey, subValue]) => (
                        <div key={subKey}>
                          <strong>{subKey}:</strong> {String(subValue)}
                        </div>
                      ))}
                    </div>
                  );
                }

                return <span>{String(value)}</span>;
              },
            }))
        : [];

    const taskCountColumn: ColumnDef<any> = {
      id: 'task-count',
      header: 'Tasks Count',
      cell: ({ row }) => {
        const taskTree = row.original.tasks;
        return <span>{countTasks(taskTree)}</span>;
      },
    };

    const tasksColumn: ColumnDef<any> = {
      id: 'tasks',
      header: 'Tasks (Details)',
      cell: ({ row }) => {
        const taskTree = row.original.tasks;
        if (!taskTree) return <span>No tasks</span>;

        const counter = { count: 0 };
        const taskPreview = renderTaskTreeLimited(taskTree, 0, 3, counter);
        const exceedsLimit = countTasks(taskTree) > 1;

        return (
          <div className="max-w-md bg-muted p-3 rounded text-xs space-y-2">
            {taskPreview}
            {exceedsLimit && (
              <div className="w-full text-center mt-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => {
                        setSelectedWorkflow(row.original);
                        setIsDialogOpen(true);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Show More...
                    </button>
                  </DialogTrigger>

                  {selectedWorkflow && (
                    <DialogContent className="max-w-[90dvw]! w-[90dvw]! h-[90dvh]! max-h-[90dvh]! overflow-auto p-4 flex flex-col gap-4">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                          Workflow Preview: {selectedWorkflow.workflow_name}
                        </DialogTitle>
                        <DialogDescription>
                          Full visual view of the workflow including all nested
                          task chains.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 w-full">
                        <WorkflowViewer workflow={selectedWorkflow} />
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            )}
          </div>
        );
      },
    };

    const actionColumn: ColumnDef<any> = {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-4 items-center justify-center mr-2">
          <button
            onClick={() => handleExecute(row.original)}
            className="text-primary hover:bg-primary hover:text-white cursor-pointer font-medium text-xs border border-primary px-2 py-1 rounded transition-colors"
            title="Run Workflow"
          >
            Run
          </button>
          <button
            onClick={() => handleDeleteClick(row.original.id)}
            className="text-red-600 hover:text-red-800 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    };

    return [...baseColumns, taskCountColumn, tasksColumn, actionColumn];
  }, [workflows, selectedWorkflow, isDialogOpen]);

  // ── Row Actions (card view only — table uses inline action column) ─────────

  const rowActions = useMemo<RowAction<any>[]>(
    () => [
      {
        label: 'View Workflow',
        icon: Eye,
        variant: 'default',
        onClick: (workflow) => {
          setCardViewWorkflow(workflow);
          setIsCardViewDialogOpen(true);
        },
      },
      {
        label: 'Run Workflow',
        icon: Play,
        variant: 'default',
        onClick: handleExecute,
      },
      {
        label: 'Delete Workflow',
        icon: Trash2,
        variant: 'danger',
        onClick: (workflow) => handleDeleteClick(workflow.id),
      },
    ],
    [],
  );

  // ── Card Config ───────────────────────────────────────────────────────────

  // Derive a display-ready description per workflow: prefer the real description
  // field; fall back to the scheduler cron + detail so cards never show a
  // generic placeholder when scheduling info is available.
  const workflowsWithDescription = useMemo(
    () =>
      workflows.map((w) => {
        if (w.description) return w;
        const s = w.scheduler_detail;
        const syntheticDesc = s?.cron
          ? `Scheduled${s.detail ? `: ${s.detail}` : ''}  •  Cron: ${s.cron}`
          : null;
        return { ...w, _cardDesc: syntheticDesc };
      }),
    [workflows],
  );

  const cardConfig = useMemo<CardConfig<any>>(
    () => ({
      titleKey: 'workflow_name',
      subtitleKey: 'id',
      descriptionKey: '_cardDesc',
      descriptionFallback:
        'No description provided. This workflow orchestrates a set of tasks in a defined execution order.',
      statusBadge: (workflow) => ({
        label: workflow.scheduler_detail?.cron ? 'Scheduled' : 'Manual',
      }),
      metaBadge: (workflow) => {
        const s = workflow.scheduler_detail;
        if (!s?.cron) return null;
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-[10px] font-bold text-primary bg-primary/5 border border-primary/15 px-2 py-0.5 rounded-md tracking-tight">
              {s.cron}
            </span>
            {s.detail && (
              <span className="text-[9px] text-muted-foreground capitalize">
                {s.detail}
              </span>
            )}
          </div>
        );
      },
    }),
    [],
  );

  // ── Project selector bar (same pattern as Tasks.tsx) ─────────────────────

  const projectSelectorNode = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">
        Viewing workflows for:
      </span>
      <Select
        value={selectedProjectId}
        onValueChange={(val) => {
          setSelectedProjectId(val);
          fetchWorkflows(val);
        }}
      >
        <SelectTrigger className="w-[220px] h-9 text-sm font-semibold">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((proj: any) => (
            <SelectItem key={proj.id} value={String(proj.id)}>
              {proj.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Separator orientation="vertical" className="h-5 hidden sm:block" />
      <span className="text-xs text-muted-foreground">
        {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
      </span>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Project selector bar */}
      <div className="bg-[#fdfdfb] px-6 lg:px-8 py-4 max-w-[1600px] mx-auto border-b border-neutral-200/60">
        <div className="bg-white border border-neutral-100 rounded-xl shadow-sm px-5 py-3 flex items-center gap-4 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Project
          </span>
          <Separator orientation="vertical" className="h-5" />
          {projectSelectorNode}
        </div>
      </div>

      <PageLayout<any>
        // ── Page meta ──────────────────────────────────────────────────────
        title="Workflows"
        subtitle="Overview of created connector and/or form workflows."
        defaultView="table"
        // ── Data ───────────────────────────────────────────────────────────
        data={workflowsWithDescription}
        isLoading={loading}
        loadingLabel="Loading Workflows"
        searchBy="workflow_name"
        // ── Stats ──────────────────────────────────────────────────────────
        stats={stats}
        // ── Table (with all original columns including task tree + actions) ─
        columns={columns}
        // ── Card ───────────────────────────────────────────────────────────
        cardConfig={cardConfig}
        rowActions={rowActions}
        // ── External delete dialog ─────────────────────────────────────────
        externalDeleteDialog={{
          open: deleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
          onConfirm: handleConfirmDelete,
          title: 'Delete Workflow?',
          description:
            'Are you sure you want to delete this workflow? This will only delete the workflow definition and will not affect the underlying tasks.',
        }}
        // ── Header action ──────────────────────────────────────────────────
        actions={[
          {
            label: 'Add Workflow',
            icon: Plus,
            onClick: () => navigate('/workflow/create'),
          },
        ]}
      />

      {/* ── Card-view Workflow Viewer Dialog ── */}
      <Dialog
        open={isCardViewDialogOpen}
        onOpenChange={(open) => {
          setIsCardViewDialogOpen(open);
          if (!open) setCardViewWorkflow(null);
        }}
      >
        {cardViewWorkflow && (
          <DialogContent className="max-w-[90dvw]! w-[90dvw]! h-[90dvh]! max-h-[90dvh]! overflow-auto p-4 flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Workflow Preview: {cardViewWorkflow.workflow_name}
              </DialogTitle>
              <DialogDescription>
                Full visual view of the workflow including all nested task
                chains.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full">
              <WorkflowViewer workflow={cardViewWorkflow} />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
