/* eslint-disable @typescript-eslint/no-explicit-any */

import ApiHelper from './ApiHelper';

export const login = (data: any) => {
  return ApiHelper.post(
    `${import.meta.env.VITE_REACT_AUTH_SERVICE_API_URL}/login`,
    data,
  );
};

export const signup = (data: any) => {
  return ApiHelper.post(
    `${import.meta.env.VITE_REACT_AUTH_SERVICE_API_URL}/signup`,
    data,
  );
};

export const verifyOTP = (data: any) => {
  return ApiHelper.post(
    `${import.meta.env.VITE_REACT_AUTH_SERVICE_API_URL}/user/api/v1/verify-otp`,
    data,
  );
};

export const generateForgotPassword = (data: any) => {
  return ApiHelper.post(
    `${import.meta.env.VITE_REACT_AUTH_SERVICE_API_URL}/user/forgotpassword`,
    data,
  );
};

export const validateForgotPasswordToken = (data: any) => {
  return ApiHelper.post(
    `${import.meta.env.VITE_REACT_AUTH_SERVICE_API_URL}/user/forgotpassword/validate`,
    data,
  );
};

export const resetPassword = (data: any) => {
  return ApiHelper.post(
    `${import.meta.env.VITE_REACT_AUTH_SERVICE_API_URL}/user/changepassword`,
    data,
  );
};

export const validateOTP = (data: any) => {
  return ApiHelper.post(
    `${import.meta.env.VITE_REACT_AUTH_SERVICE_API_URL}/user/email/otp/validate`,
    data,
  );
};

export const changePasswordWithRefId = (data: any) => {
  return ApiHelper.post(
    `${import.meta.env.VITE_REACT_AUTH_SERVICE_API_URL}/user/changepassword`,
    data,
  );
};

export const getUserProfile = () => {
  const accessToken = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  return ApiHelper.getWithHeadersAndData(
    `${import.meta.env.VITE_REACT_API_URL}/user/profile/fetch`,
    headers,
  );
};

/**
 * PROJECTS
 */
export const getProjects = () => {
  const accessToken = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  return ApiHelper.getWithHeadersAndData(
    `${import.meta.env.VITE_REACT_PROJECT_SERVICE_API_URL}/project`,
    headers,
  );
};

export const createProjects = (data: any) => {
  const accessToken = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  return ApiHelper.postWithHeaders(
    `${import.meta.env.VITE_REACT_PROJECT_SERVICE_API_URL}/project`,
    headers,
    data,
  );
};

export const getProjectEnvironments = (data: any) => {
  const accessToken = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  return ApiHelper.getWithHeadersAndData(
    `${import.meta.env.VITE_REACT_PROJECT_SERVICE_API_URL}/project/environment/${
      data.projectId
    }`,
    headers,
  );
};

/**
 * TASKS
 */
export const getTasks = (data: any) => {
  const accessToken = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  return ApiHelper.getWithHeaders(
    `${import.meta.env.VITE_REACT_PROJECT_SERVICE_API_URL}/tasks?project_id=${data.project_id}`,
    headers,
  );
};

export const createTasks = (data: any) => {
  const accessToken = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  return ApiHelper.postWithHeaders(
    `${import.meta.env.VITE_REACT_PROJECT_SERVICE_API_URL}/tasks`,
    headers,
    data,
  );
};

/**
 * WORKFLOW
 */
export const createWorkflows = (data: any) => {
  const accessToken = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  return ApiHelper.postWithHeaders(
    `${import.meta.env.VITE_REACT_API_URL}/workflow/`,
    headers,
    data,
  );
};

export const getWorkflowsForProject = (data: any) => {
  const accessToken = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  return ApiHelper.getWithHeaders(
    `${import.meta.env.VITE_REACT_API_URL}/workflow/?project_id=${
      data.project_id
    }`,
    headers,
  );
};

export const getWorkflowJobs = (data: any) => {
  const accessToken = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  return ApiHelper.postWithHeaders(
    `${import.meta.env.VITE_REACT_API_URL}/workflow/logs`,
    headers,
    data,
  );
};
