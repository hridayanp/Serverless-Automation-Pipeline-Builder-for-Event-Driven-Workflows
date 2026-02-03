/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/taskOptionUtils.ts
export function transformTasksToOptions(
  tasks: any[],
  keysToInclude: string[] = ['id', 'name']
) {
  return tasks.map((task) => {
    const option: Record<string, any> = {};
    for (const key of keysToInclude) {
      option[key] = task[key];
    }
    return option;
  });
}
