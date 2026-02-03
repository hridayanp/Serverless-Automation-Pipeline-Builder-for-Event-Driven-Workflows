type JobStatus = 'success' | 'failed' | 'queued' | 'running';

interface JobRunLog {
  task_id: string;
  task_name: string;
  status: JobStatus;
  triggered_by: 'manual' | 'scheduler';
  started_at: string | null;
  ended_at: string | null;
  duration: string;
  exit_code: number | null;
  logs: string;
}

const taskNames = [
  'Data Ingestion',
  'Data Cleaning',
  'Transform & Normalize',
  'Feature Extraction',
  'Model Training',
  'Model Evaluation',
  'Data Upload',
  'Notification Dispatch',
  'Report Generation',
];

const logMessages = {
  success: [
    'Task completed successfully.',
    'All steps executed without errors.',
    'Job finished with exit code 0.',
  ],
  failed: [
    'Null pointer exception at line 45.',
    'Script exited with error code 1.',
    'Database connection timeout.',
    'Unhandled promise rejection in transform.js.',
  ],
  running: ['Task is currently processing...', 'Running ingestion job...'],
  queued: ['Task is in queue. Awaiting resources.', 'Scheduled by CRON.'],
};

export function generateJobRunLogs(n: number): JobRunLog[] {
  const logs: JobRunLog[] = [];

  for (let i = 0; i < n; i++) {
    const statusOptions: JobStatus[] = [
      'success',
      'failed',
      'queued',
      'running',
    ];
    const status =
      statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const triggeredBy = Math.random() > 0.5 ? 'manual' : 'scheduler';
    const taskName = taskNames[Math.floor(Math.random() * taskNames.length)];
    const taskId = `task-${String(i + 1).padStart(3, '0')}`;

    let startedAt: string | null = null;
    let endedAt: string | null = null;
    let duration: string = '-';
    let exitCode: number | null = null;

    const now = new Date();
    const start = new Date(
      now.getTime() - Math.floor(Math.random() * 60) * 60000
    );

    if (status === 'success' || status === 'failed') {
      startedAt = start.toISOString();
      const end = new Date(
        start.getTime() + Math.floor(Math.random() * 10 + 1) * 60000
      );
      endedAt = end.toISOString();
      duration = `${Math.floor((+end - +start) / 60000)} min`;
      exitCode = status === 'success' ? 0 : 1;
    } else if (status === 'running') {
      startedAt = start.toISOString();
      duration = `${Math.floor((+now - +start) / 60000)} min`;
    }

    const logList = logMessages[status];
    const logsText = logList[Math.floor(Math.random() * logList.length)];

    logs.push({
      task_id: taskId,
      task_name: taskName,
      status,
      triggered_by: triggeredBy,
      started_at: startedAt,
      ended_at: endedAt,
      duration,
      exit_code: exitCode,
      logs: logsText,
    });
  }

  return logs;
}
