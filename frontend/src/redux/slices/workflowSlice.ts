import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

/**
 * Types for Project and Task Management in a Workflow
 */
export interface ProjectPayload {
  id: string;
  name: string;
  description: string;
  languages: string[];
  script_folder: string;
}

export interface EnvironmentPayload {
  id: string;
  project_id: string;
  language: string;
  method: 'YML' | 'Dockerfile' | 'Other' | 'VENV';
  env_name: string;
  file_name?: string;
  file_content?: string;
}

export interface FileData {
  file_name: string;
  file_content: string; // base64 encoded
}

export interface TaskPayload {
  id: string;
  name: string;
  description: string;
  file_data: FileData;
  requirements: FileData;
  project_id: string;
  environment_id: string;
  log_file_name: string;
}

/**
 * Combined State
 */
interface WorkflowState {
  projects: ProjectPayload[];
  environments: EnvironmentPayload[];
  selectedProject?: ProjectPayload;
  tasks: TaskPayload[];
  selectedTask?: TaskPayload;
}

const initialState: WorkflowState = {
  projects: [],
  environments: [],
  selectedProject: undefined,
  tasks: [],
  selectedTask: undefined,
};

/**
 * Slice
 */
export const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    // Project reducers
    setProjects: (state, action: PayloadAction<ProjectPayload[]>) => {
      state.projects = action.payload;
    },
    createProject: {
      reducer: (state, action: PayloadAction<ProjectPayload>) => {
        state.projects.push(action.payload);
      },
      prepare: (data: Omit<ProjectPayload, 'id'>) => {
        const id = crypto.randomUUID();
        return { payload: { id, ...data } };
      },
    },
    updateProject: (state, action: PayloadAction<ProjectPayload>) => {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
      state.environments = state.environments.filter(
        (env) => env.project_id !== action.payload
      );
    },
    setSelectedProject: (
      state,
      action: PayloadAction<ProjectPayload | undefined>
    ) => {
      state.selectedProject = action.payload;
    },

    // Environment reducers
    setEnvironments: (state, action: PayloadAction<EnvironmentPayload[]>) => {
      state.environments = action.payload;
    },
    createEnvironment: {
      reducer: (state, action: PayloadAction<EnvironmentPayload>) => {
        state.environments.push(action.payload);
      },
      prepare: (data: Omit<EnvironmentPayload, 'id'>) => {
        const id = crypto.randomUUID();
        return { payload: { id, ...data } };
      },
    },
    updateEnvironment: (state, action: PayloadAction<EnvironmentPayload>) => {
      const index = state.environments.findIndex(
        (e) => e.id === action.payload.id
      );
      if (index !== -1) {
        state.environments[index] = action.payload;
      }
    },
    deleteEnvironment: (state, action: PayloadAction<string>) => {
      state.environments = state.environments.filter(
        (e) => e.id !== action.payload
      );
    },

    // Task reducers
    setTasks: (state, action: PayloadAction<TaskPayload[]>) => {
      state.tasks = action.payload;
    },
    createTask: {
      reducer: (state, action: PayloadAction<TaskPayload>) => {
        state.tasks.push(action.payload);
      },
      prepare: (data: Omit<TaskPayload, 'id'>) => {
        const id = crypto.randomUUID();
        return { payload: { id, ...data } };
      },
    },
    updateTask: (state, action: PayloadAction<TaskPayload>) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    },
    setSelectedTask: (
      state,
      action: PayloadAction<TaskPayload | undefined>
    ) => {
      state.selectedTask = action.payload;
    },
  },
});

// Actions
export const {
  setProjects,
  createProject,
  updateProject,
  deleteProject,
  setSelectedProject,
  setEnvironments,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  setTasks,
  createTask,
  updateTask,
  deleteTask,
  setSelectedTask,
} = workflowSlice.actions;

// Selectors
export const selectAllProjects = (state: RootState) => state.workflow.projects;
export const selectAllEnvironments = (state: RootState) =>
  state.workflow.environments;
export const selectSelectedProject = (state: RootState) =>
  state.workflow.selectedProject;
export const selectAllTasks = (state: RootState) => state.workflow.tasks;
export const selectSelectedTask = (state: RootState) =>
  state.workflow.selectedTask;

// Reducer
export const workflowReducer = workflowSlice.reducer;
