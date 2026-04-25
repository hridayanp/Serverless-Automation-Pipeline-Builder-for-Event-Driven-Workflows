'use client';

import { useForm,  } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export type EnvironmentFormValues = {
  env_name: string;
  language: string;
  method: string;
  file_name: string;
  file_content: string; // base64
};

type Props = {
  onSubmit: (data: EnvironmentFormValues) => void;
  onBack: () => void;
  isSubmitting?: boolean;
};

function encodeToBase64(text: string): string {
  if (!text) return '';
  try {
    return btoa(
      encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch (e) {
    console.error('Encoding error:', e);
    return '';
  }
}

export const EnvironmentForm = ({ onSubmit, onBack, isSubmitting }: Props) => {
  const form = useForm<EnvironmentFormValues>({
    defaultValues: {
      env_name: 'dev',
      language: 'python',
      method: 'requirements.txt',
      file_name: 'requirements.txt',
      file_content: '',
    },
  });

  const [inputType, setInputType] = useState<'editor' | 'upload'>('editor');
  const [rawContent, setRawContent] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const base64 = encodeToBase64(content);
      form.setValue('file_content', base64);
      form.setValue('file_name', file.name);
    };
    reader.readAsText(file);
  };

  const handleFormSubmit = (data: EnvironmentFormValues) => {
    if (inputType === 'editor') {
      data.file_content = encodeToBase64(rawContent);
    }
    onSubmit(data);
  };

  return (
    <Card className="w-full p-6 space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="env_name"
              rules={{ required: 'Environment name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. dev, prod" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="nodejs">Node.js</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="method"
            rules={{ required: 'Method is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Installation Method</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. requirements.txt, pip" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Requirements Data</FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={inputType === 'editor' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputType('editor')}
                >
                  Editor
                </Button>
                <Button
                  type="button"
                  variant={inputType === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputType('upload')}
                >
                  Upload
                </Button>
              </div>
            </div>

            {inputType === 'upload' ? (
              <Input type="file" accept=".txt" onChange={handleFileUpload} />
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="File name (e.g. requirements.txt)"
                  {...form.register('file_name')}
                />
                <Textarea
                  placeholder="Enter your requirements here..."
                  className="min-h-[150px] font-mono"
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Project...' : 'Add Project & Environment'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};
