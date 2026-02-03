import { lazy } from 'react';

const LoginPage = lazy(() => import('@/pages/Auth/Login/Login'));
const SignupPage = lazy(() => import('@/pages/Auth/Signup/Signup'));

export const publicRoutes = [
  { path: '/', element: LoginPage },
  { path: '/signup', element: SignupPage },
];
