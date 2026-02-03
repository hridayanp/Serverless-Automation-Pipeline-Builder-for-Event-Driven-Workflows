/* eslint-disable @typescript-eslint/no-explicit-any */
import { createTasks } from '@/api/ApiService';
import TaskForm from '@/components/Forms/WorkflowManager/TaskForm';
import { SectionHeading } from '@/components/Headings/SectionHeading';
import {
  selectAllProjects,
  selectSelectedTask,
} from '@/redux/slices/workflowSlice';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const AddTasks = () => {
  const navigate = useNavigate();
  const projects = useSelector(selectAllProjects);
  const selectedTask = useSelector(selectSelectedTask);

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveTask = async (data: any) => {
    console.log('data', data);

    setIsLoading(true);
    try {
      const res = await createTasks(data);
      console.log('res', res);

      if (res?.status === 201 && res.data.status === 'success') {
        toast.success('Task created successfully');
        navigate('/workflow/tasks');
      } else {
        toast.error('Failed to create task');
      }
    } catch (e) {
      console.log('e', e);
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 px-4 sm:px-6 lg:px-8 py-4 max-w-screen-2xl mx-auto ">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <SectionHeading
          title="Add Tasks Details"
          description="Create tasks and their related information."
          showBackButton={true}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <TaskForm
          onSubmit={handleSaveTask}
          projects={projects}
          initialData={selectedTask}
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export default AddTasks;

/**
 * requests==2.31.0
 */
