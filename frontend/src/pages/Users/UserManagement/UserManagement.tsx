/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { useForm, Controller } from 'react-hook-form';

import { DataTable } from '@/components/Table/Table';
import { SectionHeading } from '@/components/Headings/SectionHeading';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  selectManagedUsers,
  addManagedUser,
  updateManagedUser,
  deleteManagedUser,
} from '@/redux/slices/userSlice';
import { Pencil, Trash2 } from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

type UserFormValues = Omit<User, 'id' | 'created_at'>;

export default function UserManagement() {
  const dispatch = useDispatch();
  const users = useSelector(selectManagedUsers);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    defaultValues: {
      name: '',
      email: '',
      role: '',
      status: '',
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteManagedUser(id));
  };

  const onSubmit = (values: UserFormValues) => {
    if (editingUser) {
      dispatch(updateManagedUser({ ...editingUser, ...values } as any));
    } else {
      const newUser = {
        id: uuidv4(),
        ...values,
        created_at: new Date().toISOString().split('T')[0],
      };
      dispatch(addManagedUser(newUser as any));
    }

    reset();
    setEditingUser(null);
    setOpen(false);
  };

  const columns: ColumnDef<User>[] = useMemo(() => {
    const baseColumns =
      users.length > 0
        ? Object.keys(users[0])
            .filter((key) => key !== 'id') // hide ID
            .map((key) => ({
              accessorKey: key,
              header: key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase()),
              cell: ({ row }: any) => <span>{row.getValue(key)}</span>,
            }))
        : [];

    const actionColumn: ColumnDef<User> = {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex gap-3 items-center">
            <Pencil
              size={20}
              className="text-blue-600 cursor-pointer hover:text-blue-800"
              onClick={() => handleEdit(user)}
            />
            <Trash2
              size={20}
              className="text-red-600 cursor-pointer hover:text-red-800"
              onClick={() => handleDelete(user.id)}
            />
          </div>
        );
      },
    };

    return [...baseColumns, actionColumn];
  }, [users]);

  return (
    <div className="grid gap-6 p-4 max-w-7xl mx-auto lg:px-6">
      <div className="flex justify-between items-center">
        <SectionHeading
          title="User Management"
          description="Overview of users and their related information."
        />
        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
              setEditingUser(null);
              reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid gap-4 py-2"
              autoComplete="off"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    autoComplete="off"
                    {...register('name', { required: true })}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">Name is required</p>
                  )}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    autoComplete="off"
                    {...register('email', { required: true })}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">Email is required</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="role">Role</Label>
                  <Controller
                    control={control}
                    name="role"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="User">User</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role && (
                    <p className="text-sm text-red-500">Role is required</p>
                  )}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    control={control}
                    name="status"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Not Approved">
                            Not Approved
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.status && (
                    <p className="text-sm text-red-500">Status is required</p>
                  )}
                </div>
              </div>
              <div>
                <Button type="submit">{editingUser ? 'Update' : 'Save'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        pagination
        toolbar
        data={users as any}
        columns={columns}
        searchBy="name"
      />
    </div>
  );
}
