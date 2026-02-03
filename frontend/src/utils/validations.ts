/* eslint-disable @typescript-eslint/no-explicit-any */
export const validatePayload = (
  payload: Record<string, any>,
  requiredKeys: string[] = []
): string[] => {
  const missingFields: string[] = [];

  for (const key of requiredKeys) {
    const value = payload[key];

    if (key === 'scheduler_detail') {
      if (!value?.cron || !value?.detail) {
        if (!value?.cron) missingFields.push('Cron');
        if (!value?.detail) missingFields.push('Cron Detail');
      }
    } else {
      if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
      ) {
        // Convert `snake_case` to `Title Case`
        const humanLabel = key
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        missingFields.push(humanLabel);
      }
    }
  }

  return missingFields;
};
