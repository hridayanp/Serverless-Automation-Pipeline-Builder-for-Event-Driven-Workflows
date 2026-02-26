/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/Table/Table';
import { SectionHeading } from '@/components/Headings/SectionHeading';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProjects, getTasks } from '@/api/ApiService';
import { Label } from '@/components/ui/label';
import { setProjects } from '@/redux/slices/workflowSlice';

export default function Tasks() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { projects } = useSelector((state: any) => state.workflow);

  const [loading, setLoading] = useState(false);
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(projects?.[0]?.id ? String(projects[0].id) : undefined);

  // Update selectedProjectId if Redux projects load later
  useEffect(() => {
    if (projects?.length > 0 && !selectedProjectId) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects]);

  // Ref-wrapped project fetcher
  const fetchProjectsRef = useRef(async () => {
    try {
      setLoading(true);
      const res = await getProjects();
      const fetched = res?.data?.data;

      if (res?.data?.success && Array.isArray(fetched) && fetched.length > 0) {
        dispatch(setProjects(fetched));
      } else {
        toast.error(res?.data?.message || 'No projects found');
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

  // Fetch tasks for selected project
  const fetchTasksByProject = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await getTasks({ project_id: projectId });
      const fetchedTasks = res?.data?.data;

      if (res?.data?.success && Array.isArray(fetchedTasks)) {
        setTasksData(fetchedTasks);
      } else {
        setTasksData([]);
        toast.error(res?.data?.message || 'No tasks found');
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

  const handleEdit = (task: any) => {
    navigate('/workflow/tasks/create', { state: { task } });
  };

  const handleDelete = () => {
    toast('Delete logic to be implemented');
  };

  const handleAddTask = () => {
    if (!projects || projects.length === 0) {
      toast.error('You must create a project before adding tasks.');
      return;
    }
    navigate('/workflow/tasks/create');
  };

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'description', header: 'Description' },
      {
        accessorKey: 'file_data_s3_key',
        header: 'Script File',
        cell: ({ row }) => {
          const key = row.original.file_data_s3_key;
          return key ? key.split('/').pop() : '-';
        },
      },
      {
        accessorKey: 'requirements_s3_key',
        header: 'Requirements File',
        cell: ({ row }) => {
          const key = row.original.requirements_s3_key;
          return key ? key.split('/').pop() : '-';
        },
      },
      { accessorKey: 'status', header: 'Status' },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const task = row.original;
          return (
            <div className="flex gap-2 items-center">
              <Pencil
                size={18}
                className="cursor-pointer text-blue-600 hover:text-blue-800"
                onClick={() => handleEdit(task)}
              />
              <Trash2
                size={18}
                className="cursor-pointer text-red-600 hover:text-red-800"
                onClick={() => handleDelete()}
              />
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="grid gap-6 px-4 sm:px-6 lg:px-8 py-4 max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <SectionHeading
          title="Tasks Management"
          description="Overview of added tasks and their related information."
        />
        <Button onClick={handleAddTask}>
          <Plus className="mr-2 w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Project selector */}
      <div className="flex flex-col gap-3">
        <Label className="text-md font-medium text-gray-700">
          Select a project to view tasks
        </Label>
        <Select
          value={selectedProjectId}
          onValueChange={(val) => setSelectedProjectId(val)}
        >
          <SelectTrigger className="w-[25%]">
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

      {/* Task Table or Loader */}
      {loading ? (
        <div className="w-full py-20 flex justify-center items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-t-transparent border-blue-600 rounded-full animate-spin" />
            <p className="text-lg font-medium text-gray-700">
              Loading tasks...
            </p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={tasksData.length > 0 ? columns : []}
          data={tasksData}
        />
      )}
    </div>
  );
}

/**
 * requests==2.31.0
 */
