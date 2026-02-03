'use client';

import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ReloadIcon } from '@radix-ui/react-icons';

export type LoginFormValues = {
  email: string;
  password: string;
};

interface LoginFormProps {
  onLogin: (values: LoginFormValues) => void;
  isSubmitting: boolean;
}

export const LoginForm = ({ onLogin, isSubmitting }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  return (
    <form onSubmit={handleSubmit(onLogin)} className="space-y-6 w-full">
      <div className="flex flex-col space-y-2 w-full">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col space-y-2 w-full">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
        {isSubmitting ? (
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          'Login'
        )}
      </Button>
    </form>
  );
};
