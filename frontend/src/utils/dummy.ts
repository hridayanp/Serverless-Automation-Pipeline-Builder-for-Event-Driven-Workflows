/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from 'uuid';

type JobStatus = 'success' | 'failed' | 'running' | 'queued';

export const dummyProjects = [
  { id: 1, name: 'Demo Project 1' },
  { id: 2, name: 'Demo Project 2' },
  { id: 3, name: 'Demo Project 3' },
];

export const dummyTaskOptions = [
  {
    id: 'task-001',
    name: 'Fetch Data',
    description: 'Fetch data from API endpoint',
  },
  {
    id: 'task-002',
    name: 'Transform Data',
    description: 'Clean and transform raw data',
  },
  {
    id: 'task-003',
    name: 'Save to Database',
    description: 'Persist the processed data to DB',
  },
  {
    id: 'task-004',
    name: 'Send Notification',
    description: 'Send notification after completion',
  },
];

export const triggerOptions = [
  { label: 'On Completion', value: 0 },
  { label: 'On Failure', value: 1 },
  { label: 'On Success', value: 2 },
];

export const generateDummyJobs = (
  workflows: any[],
  projects: any[],
  tasks: any[],
  startDate?: Date,
  endDate?: Date
): any[] => {
  const jobStatuses: JobStatus[] = ['success', 'failed', 'running', 'queued'];
  const jobs: any[] = [];

  for (const project of projects) {
    const projectTasks = tasks.filter(
      (t) => String(t.project_id) === String(project.id)
    );

    const projectWorkflows = workflows.filter(
      (wf) => String(wf.project_id) === String(project.id)
    );

    for (const wf of projectWorkflows) {
      const jobCount = Math.floor(Math.random() * 6) + 5; // 5–10 jobs

      for (let i = 0; i < jobCount; i++) {
        const status =
          jobStatuses[Math.floor(Math.random() * jobStatuses.length)];

        // Generate a job start time within the given date range
        const rangeStart =
          startDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // default: 7 days ago
        const rangeEnd = endDate ?? new Date(); // default: now
        const timeSpan = +rangeEnd - +rangeStart;

        const start = new Date(+rangeStart + Math.random() * timeSpan);

        const end =
          status === 'running' || status === 'queued'
            ? null
            : new Date(
                start.getTime() + Math.floor(Math.random() * 15) * 60000
              );

        // Shuffle task statuses
        const shuffledTasks = [...projectTasks].sort(() => Math.random() - 0.5);
        const successCount = Math.floor(shuffledTasks.length * 0.5);
        const failCount = Math.floor(shuffledTasks.length * 0.3);

        const taskStatusMap: Record<string, JobStatus> = {};
        shuffledTasks.forEach((task, index) => {
          if (index < successCount) {
            taskStatusMap[task.id] = 'success';
          } else if (index < successCount + failCount) {
            taskStatusMap[task.id] = 'failed';
          } else {
            taskStatusMap[task.id] = 'queued';
          }
        });

        const job = {
          id: uuid(),
          project_id: project.id,
          project_name: project.name,
          workflow_name: wf.workflow_name,
          status,
          started_at: start.toISOString(),
          ended_at: end?.toISOString() ?? null,
          duration: end ? `${Math.floor((+end - +start) / 60000)} min` : '-',
          trigger: Math.random() > 0.5 ? 'scheduled' : 'manual',
          tasks_executed: projectTasks.map((task: any) => ({
            task_id: task.id,
            task_name: task.name,
            status: taskStatusMap[task.id],
          })),
        };

        // Only include job if it falls inside the given range
        if (
          (!startDate || start >= startDate) &&
          (!endDate || start <= endDate)
        ) {
          jobs.push(job);
        }
      }
    }
  }

  return jobs;
};

export const dummyWorkflow = [
  {
    project_id: 'project-xyz',
    workflow_name: 'Massive Nested Workflow',
    scheduler_detail: {
      cron: '*/10 * * * *',
      detail: 'Every 10 minutes',
    },
    tasks: {
      task_id: 'task-001',
      identifier: 'main-task',
      description: 'Root task that starts everything',
      children: {
        'on-completion': [
          {
            task_id: 'task-002',
            identifier: 'comp-task-1',
            description: 'First completion task',
            children: {
              'on-success': [
                {
                  task_id: 'task-003',
                  identifier: 'succ-task-1',
                  description: 'Success after comp-task-1',
                  children: {
                    'on-failure': [
                      {
                        task_id: 'task-004',
                        identifier: 'fail-after-succ',
                        description: 'Failure after succ-task-1',
                      },
                      {
                        task_id: 'task-005',
                        identifier: 'fail-after-succ-2',
                        description: 'Second failure after succ-task-1',
                      },
                    ],
                  },
                },
                {
                  task_id: 'task-006',
                  identifier: 'succ-task-2',
                  description: 'Parallel success path',
                },
              ],
              'on-failure': [
                {
                  task_id: 'task-007',
                  identifier: 'fail-task-1',
                  description: 'Failure after comp-task-1',
                  children: {
                    'on-completion': [
                      {
                        task_id: 'task-008',
                        identifier: 'comp-task-2',
                        description: 'Recovery completion',
                        children: {
                          'on-success': [
                            {
                              task_id: 'task-009',
                              identifier: 'deep-succ-1',
                              description: 'Deep success path',
                            },
                            {
                              task_id: 'task-010',
                              identifier: 'deep-succ-2',
                              description: 'Another deep success path',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            task_id: 'task-011',
            identifier: 'comp-task-3',
            description: 'Another parallel completion task',
          },
          {
            task_id: 'task-012',
            identifier: 'comp-task-4',
            description: 'Yet another completion task',
          },
        ],
        'on-success': [
          {
            task_id: 'task-013',
            identifier: 'succ-task-main',
            description: 'Success from main task',
            children: {
              'on-completion': [
                {
                  task_id: 'task-014',
                  identifier: 'nested-comp-task',
                  description: 'Nested completion task',
                },
                {
                  task_id: 'task-015',
                  identifier: 'nested-comp-task-2',
                  description: 'Another nested completion task',
                  children: {
                    'on-failure': [
                      {
                        task_id: 'task-016',
                        identifier: 'fail-nested',
                        description: 'Failure inside nested-comp-task-2',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            task_id: 'task-017',
            identifier: 'succ-task-main-2',
            description: 'Another success path from root',
          },
        ],
        'on-failure': [
          {
            task_id: 'task-018',
            identifier: 'fail-task-main',
            description: 'Failure from main task',
          },
          {
            task_id: 'task-019',
            identifier: 'fail-task-main-2',
            description: 'Another failure path',
          },
          {
            task_id: 'task-020',
            identifier: 'fail-task-main-3',
            description: 'Extended failure scenario',
            children: {
              'on-success': [
                {
                  task_id: 'task-021',
                  identifier: 'success-retry',
                  description: 'Recovery success after failure',
                },
              ],
            },
          },
        ],
      },
    },
  },
];

export const dummyWorkflow2 = [
  {
    project_id: 'project-xyz',
    workflow_name: 'Massive Nested Workflow',
    scheduler_detail: {
      cron: '*/10 * * * *',
      detail: 'Every 10 minutes',
    },
    tasks: {
      task_id: 'task-001',
      identifier: 'main-task',
      description: 'Root task that starts everything',
      children: {
        'on-success': [
          {
            task_id: 'task-013',
            identifier: 'succ-task-main',
            description: 'Success from main task',
            children: {
              'on-success': [],
              'on-failure': [],
              'on-completion': [
                {
                  task_id: 'task-014',
                  identifier: 'nested-comp-task',
                  description: 'Nested completion task',
                  children: {
                    'on-success': [],
                    'on-failure': [],
                    'on-completion': [],
                  },
                },
                {
                  task_id: 'task-015',
                  identifier: 'nested-comp-task-2',
                  description: 'Another nested completion task',
                  children: {
                    'on-success': [],
                    'on-completion': [],
                    'on-failure': [
                      {
                        task_id: 'task-016',
                        identifier: 'fail-nested',
                        description: 'Failure inside nested-comp-task-2',
                        children: {
                          'on-success': [],
                          'on-failure': [],
                          'on-completion': [],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            task_id: 'task-017',
            identifier: 'succ-task-main-2',
            description: 'Another success path from root',
            children: {
              'on-success': [],
              'on-failure': [],
              'on-completion': [],
            },
          },
        ],
        'on-failure': [
          {
            task_id: 'task-018',
            identifier: 'fail-task-main',
            description: 'Failure from main task',
            children: {
              'on-success': [],
              'on-failure': [],
              'on-completion': [],
            },
          },
          {
            task_id: 'task-019',
            identifier: 'fail-task-main-2',
            description: 'Another failure path',
            children: {
              'on-success': [],
              'on-failure': [],
              'on-completion': [],
            },
          },
          {
            task_id: 'task-020',
            identifier: 'fail-task-main-3',
            description: 'Extended failure scenario',
            children: {
              'on-success': [
                {
                  task_id: 'task-021',
                  identifier: 'success-retry',
                  description: 'Recovery success after failure',
                  children: {
                    'on-success': [],
                    'on-failure': [],
                    'on-completion': [],
                  },
                },
              ],
              'on-failure': [],
              'on-completion': [],
            },
          },
        ],
        'on-completion': [
          {
            task_id: 'task-002',
            identifier: 'comp-task-1',
            description: 'First completion task',
            children: {
              'on-success': [
                {
                  task_id: 'task-003',
                  identifier: 'succ-task-1',
                  description: 'Success after comp-task-1',
                  children: {
                    'on-success': [],
                    'on-completion': [],
                    'on-failure': [
                      {
                        task_id: 'task-004',
                        identifier: 'fail-after-succ',
                        description: 'Failure after succ-task-1',
                        children: {
                          'on-success': [],
                          'on-failure': [],
                          'on-completion': [],
                        },
                      },
                      {
                        task_id: 'task-005',
                        identifier: 'fail-after-succ-2',
                        description: 'Second failure after succ-task-1',
                        children: {
                          'on-success': [],
                          'on-failure': [],
                          'on-completion': [],
                        },
                      },
                    ],
                  },
                },
                {
                  task_id: 'task-006',
                  identifier: 'succ-task-2',
                  description: 'Parallel success path',
                  children: {
                    'on-success': [],
                    'on-failure': [],
                    'on-completion': [],
                  },
                },
              ],
              'on-failure': [
                {
                  task_id: 'task-007',
                  identifier: 'fail-task-1',
                  description: 'Failure after comp-task-1',
                  children: {
                    'on-success': [],
                    'on-failure': [],
                    'on-completion': [
                      {
                        task_id: 'task-008',
                        identifier: 'comp-task-2',
                        description: 'Recovery completion',
                        children: {
                          'on-success': [
                            {
                              task_id: 'task-009',
                              identifier: 'deep-succ-1',
                              description: 'Deep success path',
                              children: {
                                'on-success': [],
                                'on-failure': [],
                                'on-completion': [],
                              },
                            },
                            {
                              task_id: 'task-010',
                              identifier: 'deep-succ-2',
                              description: 'Another deep success path',
                              children: {
                                'on-success': [],
                                'on-failure': [],
                                'on-completion': [],
                              },
                            },
                          ],
                          'on-failure': [],
                          'on-completion': [],
                        },
                      },
                    ],
                  },
                },
              ],
              'on-completion': [],
            },
          },
          {
            task_id: 'task-011',
            identifier: 'comp-task-3',
            description: 'Another parallel completion task',
            children: {
              'on-success': [],
              'on-failure': [],
              'on-completion': [],
            },
          },
          {
            task_id: 'task-012',
            identifier: 'comp-task-4',
            description: 'Yet another completion task',
            children: {
              'on-success': [],
              'on-failure': [],
              'on-completion': [],
            },
          },
        ],
      },
    },
  },
];
