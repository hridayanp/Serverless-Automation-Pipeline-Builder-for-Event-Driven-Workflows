/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Trash2,
  Plus,
  Eye,
  FileCode2,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { getProjects, getTasks, deleteTask } from '@/api/ApiService';
import { setProjects } from '@/redux/slices/workflowSlice';
import { PageLayout } from '@/components/Layout/PageLayout';
import type {
  StatConfig,
  RowAction,
  CardConfig,
} from '@/components/Layout/PageLayout';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  name: string;
  description?: string;
  file_data_s3_key?: string;
  requirements_s3_key?: string;
  status?: string;
  [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatLabel = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getS3FileName = (key?: string) => (key ? key.split('/').pop() : '-');

// ─── Tasks Page ───────────────────────────────────────────────────────────────

export default function Tasks() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { projects } = useSelector((state: any) => state.workflow);

  const [loading, setLoading] = useState(false);
  const [tasksData, setTasksData] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(projects?.[0]?.id ? String(projects[0].id) : undefined);

  // Detail dialog state (view task)
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  // ── Sync selectedProjectId when Redux loads projects ──────────────────────
  useEffect(() => {
    if (projects?.length > 0 && !selectedProjectId) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects]);

  // ── Fetch projects (ref-wrapped, identical to original) ───────────────────
  const fetchProjectsRef = useRef(async () => {
    try {
      setLoading(true);
      const res = await getProjects();
      const apiData = res?.data;
      if (apiData?.status === 'SUCCESS' && Array.isArray(apiData?.data)) {
        dispatch(setProjects(apiData.data));
      } else {
        toast.error(apiData?.message || 'No projects found');
        dispatch(setProjects([]));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch projects');
      dispatch(setProjects([]));
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    fetchProjectsRef.current();
  }, []);

  // ── Fetch tasks for selected project ──────────────────────────────────────
  const fetchTasksByProject = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await getTasks({ project_id: projectId });
      const apiData = res?.data;
      if (apiData?.status === 'SUCCESS' && Array.isArray(apiData?.data)) {
        setTasksData(apiData.data);
      } else {
        setTasksData([]);
        toast.error(apiData?.message || 'No tasks found');
      }
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
      toast.error('Error fetching tasks');
      setTasksData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasksByProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEdit = (task: Task) => {
    navigate('/workflow/tasks/create', { state: { task } });
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDeleteId(task.id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDeleteId) return;
    try {
      setLoading(true);
      const res = await deleteTask({ taskId: taskToDeleteId });
      if (res?.data?.status === 'SUCCESS') {
        toast.success('Task deleted successfully');
        if (selectedProjectId) fetchTasksByProject(selectedProjectId);
      } else {
        toast.error(res?.data?.message || 'Failed to delete task');
      }
    } catch (e: any) {
      console.error('Delete Error:', e);
      const errorMsg =
        e?.response?.data?.message || e?.message || 'Error deleting task';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setTaskToDeleteId(null);
    }
  };

  const handleAddTask = () => {
    if (!projects || projects.length === 0) {
      toast.error('You must create a project before adding tasks.');
      return;
    }
    navigate('/workflow/tasks/create');
  };

  const handleViewTask = (task: Task) => {
    setViewTask(task);
    setDetailOpen(true);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo<StatConfig[]>(() => {
    const activeCount = tasksData.filter(
      (t) => t.status?.toLowerCase() === 'active',
    ).length;
    const withScript = tasksData.filter((t) => t.file_data_s3_key).length;
    const withRequirements = tasksData.filter(
      (t) => t.requirements_s3_key,
    ).length;

    return [
      {
        label: 'Total Tasks',
        getValue: (d) => d.length,
        icon: ClipboardList,
        color: 'primary',
      },
      {
        label: 'Active',
        getValue: () => activeCount,
        icon: CheckCircle2,
        color: 'secondary',
      },
      {
        label: 'With Script',
        getValue: () => withScript,
        icon: FileCode2,
        color: 'tertiary',
      },
      {
        label: 'With Requirements',
        getValue: () => withRequirements,
        icon: AlertCircle,
        color: 'primary',
      },
    ];
  }, [tasksData]);

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'description', header: 'Description' },
      {
        accessorKey: 'file_data_s3_key',
        header: 'Script File',
        cell: ({ row }) => getS3FileName(row.original.file_data_s3_key) ?? '-',
      },
      {
        accessorKey: 'requirements_s3_key',
        header: 'Requirements File',
        cell: ({ row }) =>
          getS3FileName(row.original.requirements_s3_key) ?? '-',
      },
      { accessorKey: 'status', header: 'Status' },
    ],
    [],
  );

  // ── Row Actions ───────────────────────────────────────────────────────────

  const rowActions = useMemo<RowAction<Task>[]>(
    () => [
      {
        label: 'View Task',
        icon: Eye,
        variant: 'default',
        onClick: handleViewTask,
      },

      {
        label: 'Delete Task',
        icon: Trash2,
        variant: 'danger',
        onClick: handleDeleteClick,
      },
    ],
    [],
  );

  // ── Card Config ───────────────────────────────────────────────────────────

  const cardConfig = useMemo<CardConfig<Task>>(
    () => ({
      titleKey: 'name',
      subtitleKey: 'id',
      descriptionKey: 'description',
      descriptionFallback:
        'No description provided. This task is configured to run as part of a workflow pipeline.',
      statusBadge: (task) => ({
        label: task.status ?? 'Unknown',
      }),
      metaBadge: (task) =>
        task.file_data_s3_key ? (
          <Badge
            variant="outline"
            className="rounded-lg text-[9px] font-bold py-0.5 border-neutral-200 text-muted-foreground"
          >
            {getS3FileName(task.file_data_s3_key)}
          </Badge>
        ) : null,
    }),
    [],
  );

  // ── Detail dialog tab: Task Details ───────────────────────────────────────

  const renderTaskDetailsTab = (task: Task) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-white flex items-center gap-3">
          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-primary text-lg">Task Information</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(task).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {formatLabel(key)}
              </span>
              <span className="text-sm text-gray-900 break-words">
                {value !== null && value !== '' ? String(value) : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: 'Script File',
            value: getS3FileName(task.file_data_s3_key) ?? 'None',
            icon: FileCode2,
          },
          {
            label: 'Requirements File',
            value: getS3FileName(task.requirements_s3_key) ?? 'None',
            icon: FileCode2,
          },
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
              <p className="text-sm font-bold text-primary font-mono">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Project selector rendered as a custom subtitle / toolbar ──────────────
  // We surface the project selector via the PageLayout subtitle slot by
  // rendering a real <select> inline — keeping ALL original selection logic.

  const projectSelectorNode = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">
        Viewing tasks for:
      </span>

      <Select
        value={selectedProjectId ?? ''}
        onValueChange={(value) => setSelectedProjectId(value)}
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
        {tasksData.length} task{tasksData.length !== 1 ? 's' : ''}
      </span>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Project selector bar — rendered above the PageLayout */}
      <div className="bg-[#fdfdfb] px-6 lg:px-8 py-4 max-w-[1600px] mx-auto border-b border-neutral-200/60">
        <div className="bg-white border border-neutral-100 rounded-xl shadow-sm px-5 py-3 flex items-center gap-4 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Project
          </span>
          <Separator orientation="vertical" className="h-5" />
          {projectSelectorNode}
        </div>
      </div>

      <PageLayout<Task>
        // ── Page meta ──────────────────────────────────────────────────────
        title="Tasks Management"
        subtitle="Overview of added tasks and their related information."
        defaultView="card"
        // ── Data ───────────────────────────────────────────────────────────
        data={tasksData}
        isLoading={loading}
        loadingLabel="Loading Tasks"
        searchBy="name"
        // ── Stats ──────────────────────────────────────────────────────────
        stats={stats}
        // ── Table ──────────────────────────────────────────────────────────
        columns={columns}
        // ── Card ───────────────────────────────────────────────────────────
        cardConfig={cardConfig}
        // ── Row Actions ────────────────────────────────────────────────────
        rowActions={rowActions}
        // ── External delete dialog ─────────────────────────────────────────
        externalDeleteDialog={{
          open: deleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
          onConfirm: handleConfirmDelete,
          title: 'Delete Task?',
          description:
            'Are you sure you want to delete this task? This action cannot be undone and may affect workflows using this task.',
        }}
        // ── Header action ──────────────────────────────────────────────────
        actions={[
          {
            label: 'Add Task',
            icon: Plus,
            onClick: handleAddTask,
          },
        ]}
        // ── Detail dialog (View Task) ──────────────────────────────────────
        detailDialogRow={viewTask}
        detailDialog={
          viewTask
            ? {
                open: detailOpen,
                onOpenChange: (open) => {
                  setDetailOpen(open);
                  if (!open) setViewTask(null);
                },
                title: () => 'Task Details',
                subtitle: (row: Task) => `Viewing: ${row.name}`,
                icon: ClipboardList,
                tabs: [
                  {
                    value: 'details',
                    label: 'Task Details',
                    icon: ClipboardList,
                    render: renderTaskDetailsTab,
                  },
                ],
              }
            : undefined
        }
      />
    </>
  );
}
