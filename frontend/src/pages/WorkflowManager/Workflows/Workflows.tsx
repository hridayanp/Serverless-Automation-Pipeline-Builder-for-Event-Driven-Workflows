/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { DataTable } from '@/components/Table/Table';
import { SectionHeading } from '@/components/Headings/SectionHeading';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import WorkflowViewer from './View/WorkflowViewer';
import { clearConnectorWorkflows } from '@/redux/slices/connectorSlice';
import { getWorkflowsForProject, getProjects } from '@/api/ApiService';
import {
  setProjects as setProjectState,
  setTasks,
} from '@/redux/slices/workflowSlice';

export default function Workflow() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { projects } = useSelector((state: any) => state.workflow);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(setTasks([]));
  }, []);

  // Ref for fetchProjects
  const fetchProjectsRef = useRef(async () => {
    try {
      const res = await getProjects();
      if (Array.isArray(res?.data) && res.data.length > 0) {
        dispatch(setProjectState(res.data));
        const firstProjectId = String(res.data[0].id);
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
    counter = { count: 0 }
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
                          counter
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
        </li>
      </ul>
    );
  };

  const handleDelete = () => {
    dispatch(clearConnectorWorkflows());
    toast.error('Please contact admin');
  };

  const columns: ColumnDef<any>[] = useMemo(() => {
    const baseColumns =
      workflows.length > 0
        ? Object.keys(workflows[0])
            .filter((key) => key !== 'tasks')
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
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Show More...
                    </button>
                  </DialogTrigger>

                  {selectedWorkflow && (
                    <DialogContent className="!max-w-[90dvw] !w-[90dvw] !h-[90dvh] !max-h-[90dvh] overflow-auto p-4 flex flex-col gap-4">
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
      cell: () => (
        <div className="flex gap-4 items-center justify-center mr-2">
          <button
            onClick={handleDelete}
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

  return (
    <div className="grid gap-6 p-4 max-w-7xl mx-auto lg:px-6">
      <div className="flex justify-between items-center">
        <SectionHeading
          title="Workflows"
          description="Overview of created connector and/or form workflows."
        />
        <Button onClick={() => navigate('/workflow/create')}>
          <Plus className="mr-2 w-4 h-4" /> Add Workflow
        </Button>
      </div>

      <div className="w-64">
        <Select
          value={selectedProjectId}
          onValueChange={(val) => {
            setSelectedProjectId(val);
            fetchWorkflows(val);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((proj: any) => (
              <SelectItem key={proj.id} value={String(proj.id)}>
                {proj.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="w-full py-20 flex justify-center items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-t-transparent border-blue-600 rounded-full animate-spin" />
            <p className="text-lg font-medium text-gray-700">
              Loading workflows...
            </p>
          </div>
        </div>
      ) : (
        <DataTable
          pagination
          toolbar
          columns={workflows.length > 0 ? columns : []}
          data={workflows}
          searchBy="workflow_name"
        />
      )}
    </div>
  );
}
