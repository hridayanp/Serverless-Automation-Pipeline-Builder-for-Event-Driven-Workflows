// src/services/projectService.js
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import {
  putItem,
  getItem,
  scanTable,
  updateItem,
  deleteItem,
} from '../aws/dynamoService.js';
import {
  TABLE_PROJECTS,
  TABLE_PROJECT_ENVS,
} from '../../config/dynamoConfig.js';

// Create new project
export const createProject = async ({ name, description, script_folder }) => {
  const projectId = uuidv4();
  const newProject = { id: projectId, name, description, script_folder };

  await putItem(TABLE_PROJECTS, newProject);

  // ✅ Use /tmp (only writable path in Lambda)
  const basePath = '/tmp';
  const projectPath = path.join(basePath, script_folder);

  if (fs.existsSync(projectPath)) {
    throw new Error('Folder already exists');
  }

  fs.mkdirSync(projectPath, { recursive: true });

  return newProject;
};

// Get project by ID
export const getProjectById = async (projectId) => {
  const project = await getItem(TABLE_PROJECTS, { id: projectId });
  return project || null;
};

// Get all projects
export const getAllProjects = async () => {
  const projects = await scanTable(TABLE_PROJECTS);
  return projects;
};

// Create environment entry
export const createProjectEnvironment = async ({
  project_id,
  env_name,
  language,
  method,
  file_name,
  file_content,
}) => {
  const envId = uuidv4();
  const basePath = '/tmp';
  const projectPath = path.join(basePath, project_id);

  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }

  const envFilePath = path.join(projectPath, file_name || '');

  if (file_content) {
    const decoded = Buffer.from(file_content, 'base64').toString('utf-8');
    fs.writeFileSync(envFilePath, decoded, { encoding: 'utf-8' });
  }

  const envItem = {
    id: envId,
    project_id,
    env_name,
    language,
    method,
    status: 'IN_PROGRESS',
    file_path: envFilePath,
  };

  await putItem(TABLE_PROJECT_ENVS, envItem);
  return envItem;
};

// Update environment status
export const updateEnvStatus = async (envId, status) => {
  const updateExpression = 'SET #s = :s';
  const expressionValues = { ':s': status };
  const expressionNames = { '#s': 'status' };

  const updated = await updateItem(
    TABLE_PROJECT_ENVS,
    { id: envId },
    updateExpression,
    expressionValues,
    expressionNames,
  );

  return updated;
};

// Get environments for a project
export const getProjectEnvironments = async (projectId) => {
  const envs = await scanTable(TABLE_PROJECT_ENVS);
  return envs.filter((e) => e.project_id === projectId);
};

// Delete project (and its environments if any)
export const deleteProject = async (projectId) => {
  // 1️⃣ Check if project exists
  const project = await getItem(TABLE_PROJECTS, { id: projectId });

  if (!project) {
    throw new Error('Project not found');
  }

  // 2️⃣ Delete all environments linked to this project (background)
  const allEnvs = await scanTable(TABLE_PROJECT_ENVS);
  const relatedEnvs = allEnvs.filter((env) => env.project_id === projectId);

  if (relatedEnvs.length > 0) {
    await Promise.all(
      relatedEnvs.map((env) => deleteItem(TABLE_PROJECT_ENVS, { id: env.id })),
    );
  }

  // 3️⃣ Delete project record
  await deleteItem(TABLE_PROJECTS, { id: projectId });

  // 4️⃣ Remove folder from /tmp (if exists)
  const basePath = '/tmp';
  const projectPath = path.join(basePath, projectId);

  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }

  return {
    status: 'SUCCESS',
    message: 'Project and associated environments deleted successfully',
  };
};
