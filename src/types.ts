import { FetchPolicy } from 'apollo-client';
import { PickerOptions } from 'filestack-js';
import React from 'react';

export type FileValue = {
  fileId: string;
  filename: string;
  id?: string;
  downloadUrl?: string;
  mimetype?: string;
  public?: boolean;
};

export type FileInputValue = FileValue | FileValue[];

export type OriginalFileInputValue = File | File[];

export type RenderPropType = {
  pick: (options: PickerOptions) => Promise<void>;
  value: FileInputValue | null;
  originalFile: OriginalFileInputValue | null;
  error: Record<string, unknown> | null;
  loading?: boolean;
};

export type AWSRenderPropType = Omit<RenderPropType, 'pick'> & {
  pick: (options: PickerOptions) => void;
};

export type CommonFileInputProps = {
  onChange?: (value: FileInputValue, originalFile: OriginalFileInputValue) => void;
  children: (args: RenderPropType) => React.JSX.Element;
  public?: boolean;
  fetchPolicy?: FetchPolicy;
  maxFiles?: number;
  sessionCache?: boolean;
  onUploadDone?: (
    value: FileInputValue,
    originalFile?: OriginalFileInputValue,
  ) => Promise<FileInputValue>;
  value?: FileInputValue | null;
  useFilestack?: boolean;
  environment?: string;
  workspace?: string;
  apiKey?: string;
  uploadHost?: string;
};

export type FilestackFileInputProps = CommonFileInputProps & {
  fallbackOptions?: PickerOptions;
}

export type AWSFileInputProps = Omit<CommonFileInputProps, 'children'> & {
  children: (args: AWSRenderPropType) => React.JSX.Element;
  fallbackOptions?: PickerOptions;
  useFilestack?: boolean;
  environment?: string;
  workspace?: string;
  apiKey?: string;
  uploadHost?: string;
};

export type FileInputState = {
  path: string | null;
  error: Record<string, unknown> | null;
  value: FileInputValue | null;
  originalFile: OriginalFileInputValue | null;
};
