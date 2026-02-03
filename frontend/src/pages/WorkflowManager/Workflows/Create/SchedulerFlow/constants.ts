export const NODE_WIDTH = 384;
export const HORIZONTAL_GAP = 100;
export const VERTICAL_GAP = 150;

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
