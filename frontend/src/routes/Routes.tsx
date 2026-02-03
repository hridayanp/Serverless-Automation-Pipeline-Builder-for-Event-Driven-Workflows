import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { publicRoutes } from './PublicRoutes';
import { PrivateRoute, PublicRoute } from './Routing';
import { protectedRoutes } from './ProtectedRoutes';
// import { protectedRoutes } from './ProtectedRoutes';

const NotFoundPage = lazy(() => import('@/components/NotFound/NotFound'));

const AppRoutes = () => {
  return (
    <Suspense>
      <Routes>
        {publicRoutes.map((route, index) => {
          return (
            <Route
              path={route?.path}
              element={
                <PublicRoute>
                  <route.element />
                </PublicRoute>
              }
              key={index}
            />
          );
        })}

        {protectedRoutes.map((route, index) => {
          return (
            <Route
              path={'/' + route?.path}
              element={
                <PrivateRoute>
                  <route.element />
                </PrivateRoute>
              }
              key={index}
            />
          );
        })}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
