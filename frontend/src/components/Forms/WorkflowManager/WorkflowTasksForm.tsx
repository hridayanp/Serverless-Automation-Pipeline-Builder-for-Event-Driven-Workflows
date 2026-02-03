/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, useFieldArray } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const dummyTaskOptions = [
  {
    id: 'task-001',
    name: 'Fetch Data',
    description: 'Fetch data from API endpoint',
  },
  {
    id: 'task-002',
    name: 'Transform Data',
    description: 'Clean and transform raw data',
  },
  {
    id: 'task-003',
    name: 'Save to Database',
    description: 'Persist the processed data to DB',
  },
  {
    id: 'task-004',
    name: 'Send Notification',
    description: 'Send notification after completion',
  },
];

const WorkflowTasksForm = ({
  nestIndex,
  control,
  register,
  remove,
  setValue,
}: any) => {
  const {
    fields,
    append,
    remove: removeChild,
  } = useFieldArray({
    control,
    name: `tasks${nestIndex ? `${nestIndex}` : ''}.children`,
  });

  const path = `tasks${nestIndex ? `${nestIndex}` : ''}`;

  return (
    <div className="border rounded-md p-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Task ID</Label>
          <Controller
            control={control}
            name={`${path}.task_id`}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  const selected = dummyTaskOptions.find((d) => d.id === value);
                  if (selected) {
                    setValue(`${path}.description`, selected.description);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {dummyTaskOptions.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Description</Label>
          <Input
            {...register(`${path}.description`)}
            placeholder="Task Description"
          />
        </div>

        {nestIndex && (
          <>
            <div className="flex flex-col gap-2">
              <Label>Exit Code</Label>
              <Input
                type="number"
                {...register(`${path}.on_exit_code`)}
                placeholder="Exit Code"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Identifier</Label>
              <Input
                {...register(`${path}.identifier`)}
                placeholder="Identifier"
              />
            </div>
            <div className="flex justify-start items-center pt-6">
              <Button
                type="button"
                variant="ghost"
                className="text-red-500 hover:text-red-700"
                onClick={remove}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {fields.map((child, index) => (
          <WorkflowTasksForm
            key={child.id}
            nestIndex={`${
              nestIndex ? `${nestIndex}.children` : 'children'
            }.${index}`}
            control={control}
            register={register}
            setValue={setValue}
            remove={() => removeChild(index)}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              task_id: '',
              description: '',
              identifier: '',
              on_exit_code: 0,
              children: [],
            })
          }
        >
          <Plus className="w-4 h-4 mr-1" /> Add Sub-task
        </Button>
      </div>
    </div>
  );
};

export default WorkflowTasksForm;
