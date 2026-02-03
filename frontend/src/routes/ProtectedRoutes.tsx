/**
 * ADD POST-LOGIN PAGE ROUTES HERE
 *
 */

import { lazy } from 'react';

const DashbaordPage = lazy(() => import('@/pages/Dashboard/Dashboard'));

const UserManagementPage = lazy(
  () => import('@/pages/Users/UserManagement/UserManagement')
);

const ProjectsPage = lazy(
  () => import('@/pages/WorkflowManager/Projects/Projects')
);
const TasksPage = lazy(() => import('@/pages/WorkflowManager/Tasks/Tasks'));

const TasksCreatePage = lazy(
  () => import('@/pages/WorkflowManager/Tasks/AddTasks')
);

const WorkflowCreatePage = lazy(
  () => import('@/pages/WorkflowManager/Workflows/Create/WorkflowCreate')
);

const WorkflowPage = lazy(
  () => import('@/pages/WorkflowManager/Workflows/Workflows')
);

const WorkflowEditPage = lazy(
  () => import('@/pages/WorkflowManager/Workflows/Edit/EditWorkflowNodes')
);

const JobsPage = lazy(() => import('@/pages/WorkflowManager/Jobs/Jobs'));
const JobDetailsPage = lazy(
  () => import('@/pages/WorkflowManager/Jobs/JobDetails')
);

export const protectedRoutes = [
  { path: '/dashboard', element: DashbaordPage },
  { path: '/users', element: UserManagementPage },

  { path: '/workflow/projects', element: ProjectsPage },
  { path: '/workflow/tasks', element: TasksPage },
  { path: '/workflow/tasks/create', element: TasksCreatePage },

  { path: '/workflow/create', element: WorkflowCreatePage },
  { path: '/workflow/details', element: WorkflowPage },
  { path: '/workflow/edit', element: WorkflowEditPage },

  { path: '/workflow/jobs', element: JobsPage },
  { path: '/workflow/job-details', element: JobDetailsPage },
];
