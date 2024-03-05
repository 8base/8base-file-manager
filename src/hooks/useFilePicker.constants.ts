export const STEPS = {
  select: 'select',
  upload: 'upload',
  uploadMore: 'uploadMore',
  uploading: 'uploading',
  error: 'error',
} as const;

export type StepType = keyof typeof STEPS;
