/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ScriptEditor from '@/components/CodeEditor/CodeEditor';
import { getProjectEnvironments } from '@/api/ApiService';
import toast from 'react-hot-toast';
import { ReloadIcon } from '@radix-ui/react-icons';

interface TaskFormProps {
  onSubmit: (data: any) => void;
  projects: { id: string | number; name: string; script_folder: string }[];
  initialData?: any;
  loading?: boolean;
}

function encodeToBase64(text: string): string {
  return typeof window !== 'undefined'
    ? btoa(unescape(encodeURIComponent(text)))
    : '';
}

export default function TaskForm({
  onSubmit,
  projects,
  initialData,
  loading,
}: TaskFormProps) {
  const scriptEditorRef = useRef<any>(null);

  const { register, control, handleSubmit, setValue, watch, reset } =
    useForm<any>({
      defaultValues: initialData || {},
    });

  const [scriptInputType, setScriptInputType] = useState<'editor' | 'upload'>(
    initialData?.file_data?.file_name ? 'upload' : 'editor'
  );
  const [requirementsInputType, setRequirementsInputType] = useState<
    'editor' | 'upload'
  >(initialData?.requirements?.file_name ? 'upload' : 'editor');
  const [envOptions, setEnvOptions] = useState<any[]>([]);
  const [showEnvSelect, setShowEnvSelect] = useState(false);
  const [loadingEnv, setLoadingEnv] = useState(false);

  const selectedProjectId = watch('project_id');

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchEnvironments(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchEnvironments = async (projectId: string | number) => {
    try {
      setLoadingEnv(true);
      const res = await getProjectEnvironments({ projectId });
      if (res?.data?.status === 'success' && Array.isArray(res.data.data)) {
        setEnvOptions(res.data.data);
        setShowEnvSelect(true);
      } else {
        toast.error('No environments found');
        setEnvOptions([]);
        setShowEnvSelect(false);
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
      toast.error('Failed to fetch environments');
      setEnvOptions([]);
      setShowEnvSelect(false);
    } finally {
      setLoadingEnv(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'file_data' | 'requirements'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const base64 = encodeToBase64(content);
      setValue(`${field}.file_content`, base64);
      setValue(`${field}.file_name`, file.name);
    };
    reader.readAsText(file);
  };

  const onFormSubmit = (data: any) => {
    if (scriptInputType === 'editor' && scriptEditorRef.current) {
      const code = scriptEditorRef.current.getValue?.() || '';
      data.file_data = {
        file_name: data.file_data?.file_name || 'script.py',
        file_content: encodeToBase64(code),
      };
    }

    if (requirementsInputType === 'editor') {
      data.requirements = {
        file_name: data.requirements?.file_name || 'requirements.txt',
        file_content: encodeToBase64(data.requirements?.file_content || ''),
      };
    }

    onSubmit(data);
  };

  return (
    <div className="relative">
      {/* Blurred form when loading */}
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className={`rounded space-y-5 relative ${
          loadingEnv ? 'pointer-events-none select-none opacity-50' : ''
        }`}
      >
        <div className="flex flex-col gap-2">
          <Label>Name</Label>
          <Input {...register('name', { required: true })} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Description</Label>
          <Textarea {...register('description')} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Project</Label>
          <Controller
            control={control}
            name="project_id"
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={(value) => {
                  field.onChange(value);

                  const selected = projects.find(
                    (p) => String(p.id) === String(value)
                  );
                  if (selected?.script_folder) {
                    setValue('script_folder_name', selected.script_folder);
                  }

                  console.log('Selected Project ID:', value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {loadingEnv ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-t-transparent border-gray-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-600">
              Fetching environments...
            </span>
          </div>
        ) : showEnvSelect ? (
          <div className="flex flex-col gap-2">
            <Label>Environment</Label>
            <Controller
              control={control}
              name="environment_id"
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {envOptions.map((env: any) => (
                      <SelectItem key={env.id} value={String(env.id)}>
                        {env.language} - {env.env_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label>Script Folder Name</Label>
          <Input
            {...register('script_folder_name', {
              required: true,
              pattern: /^[\w-/]+$/,
            })}
            placeholder="Enter script folder name"
            readOnly // 🔒 Make it read-only
            className="cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Script File (.py)</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={scriptInputType === 'editor' ? 'default' : 'outline'}
              onClick={() => setScriptInputType('editor')}
            >
              Editor
            </Button>
            <Button
              type="button"
              variant={scriptInputType === 'upload' ? 'default' : 'outline'}
              onClick={() => setScriptInputType('upload')}
            >
              Upload
            </Button>
          </div>
          {scriptInputType === 'upload' ? (
            <Input
              type="file"
              accept=".py"
              onChange={(e) => handleFileUpload(e, 'file_data')}
            />
          ) : (
            <>
              <Input
                placeholder="Enter file name"
                {...register('file_data.file_name', { required: true })}
              />
              <ScriptEditor
                ref={scriptEditorRef}
                initialCode={
                  initialData?.file_data?.file_content
                    ? atob(initialData.file_data.file_content)
                    : ''
                }
              />
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Requirements File (.txt)</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={
                requirementsInputType === 'editor' ? 'default' : 'outline'
              }
              onClick={() => setRequirementsInputType('editor')}
            >
              Editor
            </Button>
            <Button
              type="button"
              variant={
                requirementsInputType === 'upload' ? 'default' : 'outline'
              }
              onClick={() => setRequirementsInputType('upload')}
            >
              Upload
            </Button>
          </div>
          {requirementsInputType === 'upload' ? (
            <Input
              type="file"
              accept=".txt"
              onChange={(e) => handleFileUpload(e, 'requirements')}
            />
          ) : (
            <Textarea
              rows={4}
              placeholder="Enter requirements..."
              {...register('requirements.file_content')}
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Log File Name</Label>
          <Input
            {...register('log_file_name', {
              required: true,
              pattern: /^[\w-]+$/,
            })}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="w-[15%] mt-2 flex justify-center items-center"
          >
            {loading ? (
              <ReloadIcon className="h-4 w-4 animate-spin" />
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
