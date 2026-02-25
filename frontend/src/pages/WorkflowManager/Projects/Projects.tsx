/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setProjects } from '@/redux/slices/workflowSlice';

import {
  ProjectForm,
  type ProjectFormValues,
} from '@/components/Forms/WorkflowManager/ProjectForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/Table/Table';
import { SectionHeading } from '@/components/Headings/SectionHeading';
import { createProjects, getProjects } from '@/api/ApiService';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const { projects } = useSelector((state: any) => state.workflow);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref-wrapped fetchProjects to preserve identity
  const fetchProjectsRef = useRef(async () => {
    try {
      setIsSubmitting(true);
      const res = await getProjects();
      console.log('res', res);

      // ✅ FIX HERE
      const fetched = res?.data?.data;

      if (Array.isArray(fetched) && fetched.length > 0) {
        dispatch(setProjects(fetched));
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

  const handleSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await createProjects(values);
      console.log('res', res);

      if (
        res &&
        res.data?.status === 'success' &&
        res?.data?.message === 'Project created successfully.'
      ) {
        toast.success(res.data.message);
        await fetchProjectsRef.current(); // Refresh project list
      } else {
        toast.error('Project creation failed');
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Project creation failed');
    } finally {
      setIsSubmitting(false);
      setDialogOpen(false);
    }
  };

  const handleDelete = () => {
    toast.error(
      'Please contact administrator to delete a project and its related environments',
    );
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
      cell: () => (
        <div className="flex justify-center items-center mr-[20%]">
          <Trash2
            size={20}
            className="text-red-600 cursor-pointer hover:text-red-800"
            onClick={() => handleDelete()}
          />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>

          <ProjectForm
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
