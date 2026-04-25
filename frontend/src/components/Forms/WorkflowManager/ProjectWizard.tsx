'use client';

import { useState } from 'react';
import { ProjectForm, type ProjectFormValues } from './ProjectForm';
import { EnvironmentForm, type EnvironmentFormValues } from './EnvironmentForm';
import { createProjects, createProjectEnvironments } from '@/api/ApiService';
import toast from 'react-hot-toast';

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export const ProjectWizard = ({ onSuccess, onCancel }: Props) => {
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProjectSubmit = (data: ProjectFormValues) => {
    setProjectData(data);
    setStep(2);
  };

  const handleFinalSubmit = async (envData: EnvironmentFormValues) => {
    if (!projectData) return;

    setIsSubmitting(true);
    try {
      // 1. Create Project
      const projectRes = await createProjects(projectData);
      const projectApiData = projectRes?.data;

      if (projectApiData?.status === 'SUCCESS' && projectApiData?.data?.id) {
        const projectId = projectApiData.data.id;

        // 2. Create Environment
        const envPayload = {
          ...envData,
          project_id: projectId,
        };

        const envRes = await createProjectEnvironments(envPayload);
        const envApiData = envRes?.data;

        if (envApiData?.status === 'SUCCESS') {
          toast.success('Project and Environment created successfully!');
          onSuccess();
        } else {
          toast.error(envApiData?.message || 'Failed to create environment');
        }
      } else {
        toast.error(projectApiData?.message || 'Failed to create project');
      }
    } catch (error: any) {
      console.error('Wizard Error:', error);
      toast.error(error?.response?.data?.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-600'}`}>
          {step > 1 ? '✓' : '1'}
        </div>
        <div className="h-px w-8 bg-gray-200" />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
          2
        </div>
        <span className="text-sm font-medium text-gray-500">
          {step === 1 ? 'Project Details' : 'Environment Configuration'}
        </span>
      </div>

      {step === 1 ? (
        <ProjectForm
          onSubmit={handleProjectSubmit}
          onCancel={onCancel}
          isSubmitting={false}
        />
      ) : (
        <EnvironmentForm
          onSubmit={handleFinalSubmit}
          onBack={() => setStep(1)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
