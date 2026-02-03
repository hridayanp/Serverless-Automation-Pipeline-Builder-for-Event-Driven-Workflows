/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  LoginForm,
  type LoginFormValues,
} from '@/components/Forms/Authentication/LoginForm';
import { login } from '@/api/ApiService';

const Login = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const search = useLocation().search;
  const isAutologin = new URLSearchParams(search).get('autoLogin');
  const hasAutologinRun = useRef(false);

  const handleLogin = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      const res = await login(data);

      if (res?.status === 200 && res.data.success !== false) {
        localStorage.setItem('access_token', res.data.data.access_token);
        localStorage.setItem('refresh_token', res.data.data.refresh_token);

        navigate('/dashboard');
      } else {
        toast.error(res?.data?.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      toast.error('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isAutologin && !hasAutologinRun.current) {
      hasAutologinRun.current = true;
      handleLogin({
        email: 'hridayan@misteo.co',
        password: 'hpdev123',
      });
    }
  }, [isAutologin]);

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-2xl font-semibold tracking-tight">
          Log in to your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to login
        </p>
      </div>

      <LoginForm onLogin={handleLogin} isSubmitting={isSubmitting} />

      <p
        className="ml-1 underline cursor-pointer text-sm text-muted-foreground"
        onClick={() => navigate('/forgot-password')}
      >
        Forgot Password?
      </p>
    </div>
  );
};

export default Login;
