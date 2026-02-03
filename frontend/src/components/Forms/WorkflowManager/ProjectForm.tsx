'use client';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { useForm } from 'react-hook-form';

export type ProjectFormValues = {
  name: string;
  description: string;
  languages: string[];
  script_folder: string;
};

const languageOptions = ['python'];

type Props = {
  initialValues?: ProjectFormValues;
  onSubmit: (data: ProjectFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

export const ProjectForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) => {
  const form = useForm<ProjectFormValues>({
    defaultValues: initialValues ?? {
      name: '',
      description: '',
      languages: [],
      script_folder: '',
    },
  });

  return (
    <Card className="w-full p-6 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Project name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter project name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe your project..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Languages</FormLabel>
            <MultiSelect
              options={languageOptions}
              selected={form.watch('languages')}
              onChange={(langs) => form.setValue('languages', langs)}
            />
          </FormItem>

          <FormField
            control={form.control}
            name="script_folder"
            rules={{
              required: 'Script folder is required',
              pattern: {
                value: /^[a-zA-Z0-9-_]+$/,
                message:
                  'Only letters, numbers, dashes and underscores allowed',
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Script Folder Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. backend-scripts" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {initialValues ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};
