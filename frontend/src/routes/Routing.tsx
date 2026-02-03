import type { FC } from 'react';
import { Navigate } from 'react-router-dom';

interface RouteProps {
  children?: React.ReactNode;
  location?: {
    pathname: string;
  };
}

const PublicRoute: FC<RouteProps> = ({ children }) => {
  // console.log('PublicRoute rest', rest)
  // console.log('PublicRoute', localStorage.getItem('access_token'), localStorage.getItem('refresh_token'))
  if (
    localStorage.getItem('access_token') &&
    localStorage.getItem('refresh_token')
  ) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

const PrivateRoute: FC<RouteProps> = ({ children }: RouteProps) => {
  if (
    !localStorage.getItem('access_token') ||
    !localStorage.getItem('refresh_token')
  ) {
    return <Navigate to="/" />;
  }
  return children;
};

export { PrivateRoute, PublicRoute };
