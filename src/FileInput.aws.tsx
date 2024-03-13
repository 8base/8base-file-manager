// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';

import { PickerOptions } from 'filestack-js';

import { AWSFileInputProps } from 'src/types';

import { Modal, FilePickerContent } from './components';
import { useFilePicker } from './hooks';

const UNSUPPORTED_OPTIONS = [
  'allowManualRetry',
  'fromSources',
  'container',
  'cleanupImageExif',
  'customAuthText',
  'displayMode', // may be implemented in the future
  'customSourceContainer',
  'customSourcePath',
  'customSourceName',
  'customText',
  'disableStorageKey',
  'disableTransformer', // true by default
  'disableThumbnails', // false by default, may be implemented in the future
  'dropPane',
  'exposeOriginalFile',
  'globalDropZone',
  'hideModalWhenUploading', // may be implemented in the future
  'imageDim',
  'imageMax',
  'imageMin',
  'lang', // may be implemented in the future
  'viewType', // may be implemented in the future
  'errorsTimeout',
  'modalSize', // may be implemented in the future
  'rootId',
  'startUploadingWhenMaxFilesReached', // may be implemented in the future
  'storeTo',
  'transformations', // may be implemented in the future
  'uploadConfig',
  'uploadInBackground', // may be implemented in the future
  'videoResolution', // may be implemented in the future
  'minFiles', // may be implemented in the future
];

const warnAboutOptions = (options: PickerOptions = {}) => {
  if ('maxFiles' in options) {
    console.warn('@8base-react/file-input: Specify "maxFiles" as a prop for FileInput component');
  }

  if ('onUploadDone' in options) {
    console.warn(
      '@8base-react/file-input: Specify "onUploadDone" as a prop for FileInput component',
    );
  }

  setTimeout(() => {
    UNSUPPORTED_OPTIONS.forEach(optionKey => {
      if (optionKey in options) {
        console.warn(`@8base-react/file-input: ${optionKey} option is not supported yet`);
      }
    });
  }, 0);
};

export const FileInputAws: React.FC<AWSFileInputProps> = ({
  children,
  maxFiles,
  fallbackOptions,
  value: controlledValue = null,
  onUploadDone: uploadCallback,
  errorCallback,
  onChange,
  useFilestack = false,
  workspace,
  apiKey,
  uploadHost,
  environment,
}) => {
  const [calledFallback, setCalledFallback] = useState<boolean>(false);
  const {
    fileList,
    fileProgressList,
    isOpen,
    hideFilePicker,
    showFilePicker,
    addFiles,
    removeFile,
    step,
    setUploadMoreStep,
    setUploadStep,
    upload,
    getRootProps,
    getInputProps,
    options,
    value,
    originalFile,
    error,
  } = useFilePicker({ uploadCallback, controlledValue, onChange ,errorCallback});
  //console.log(error);

  const pick = useCallback(
    (pickerOptions: PickerOptions = {}) => {
      warnAboutOptions(options);
      showFilePicker({ ...pickerOptions, maxFiles });
    },
    [showFilePicker, maxFiles, options],
  );

  useEffect(() => {
    if (calledFallback) {
      return;
    }

    if (fallbackOptions) {
      pick(fallbackOptions);
    }

    setCalledFallback(true);
  }, [fallbackOptions, calledFallback, pick]);


  const handleAWSUpload = () => {
    // eslint-disable-next-line no-console
    //console.log(useFilestack, workspace, apiKey, uploadHost, environment);
    upload(useFilestack, workspace, apiKey, uploadHost, environment);
  };

  return (
    <>
      <Modal isOpen={ isOpen || !!error } onClose={ hideFilePicker }>
        <FilePickerContent
          step={ step }
          hideFilePicker={ hideFilePicker }
          addFiles={ addFiles }
          fileList={ fileList }
          setUploadStep={ setUploadStep }
          removeFile={ removeFile }
          setUploadMoreStep={ setUploadMoreStep }
          upload={ handleAWSUpload }
          fileProgressList={ fileProgressList }
          getInputProps={ getInputProps }
          getRootProps={ getRootProps }
          errorMessage= {error}
          options={ options }
        />
      </Modal>
      {children({ pick, value, originalFile, error })}
    </>
  );
};
