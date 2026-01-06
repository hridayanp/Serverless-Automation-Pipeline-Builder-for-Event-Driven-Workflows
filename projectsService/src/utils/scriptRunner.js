import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Runs a Python script safely inside Lambda
 */
export const runPythonScript = ({ taskId, environmentId }) => {
  return new Promise((resolve) => {
    const scriptPath = path.join('/tmp', `${taskId}.py`);

    // NOTE:
    // You should already download the script from S3 into /tmp
    // before calling this function.

    const python = spawn('python3', [scriptPath]);

    python.stdout.on('data', (data) => {
      console.log(`[Task ${taskId} STDOUT]:`, data.toString());
    });

    python.stderr.on('data', (data) => {
      console.error(`[Task ${taskId} STDERR]:`, data.toString());
    });

    python.on('close', (code) => {
      console.log(`Task ${taskId} exited with code ${code}`);
      resolve(code ?? 1);
    });
  });
};
