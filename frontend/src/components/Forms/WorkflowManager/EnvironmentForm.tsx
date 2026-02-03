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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';

export type EnvironmentFormValues = {
  env_name: string;
  language: string;
  method: string;
  file: File | null;
};

const languageOptions = ['python'];
const methodOptions = ['Venv', 'Dockerfile', 'Other'];

type Props = {
  initialValues?: EnvironmentFormValues;
  onSubmit: (data: EnvironmentFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

export const EnvironmentForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) => {
  const form = useForm<EnvironmentFormValues>({
    defaultValues: initialValues ?? {
      env_name: '',
      language: 'python',
      method: 'Venv',
      file: null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Environment Name */}
        <FormField
          control={form.control}
          name="env_name"
          rules={{ required: 'Environment name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Environment Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., dev-env or staging-env" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Language and Method in 2-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Language */}
          <FormField
            control={form.control}
            name="language"
            rules={{ required: 'Language is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Method */}
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setup Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {methodOptions.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* File Upload */}
        {/* <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Config File</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".yml,.yaml,.dockerfile,.txt"
                  onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {initialValues ? 'Update Environment' : 'Add Environment'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
