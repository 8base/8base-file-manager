// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';

import axios from 'axios';
import { PickerOptions } from 'filestack-js';
import { useMutation } from '@apollo/client';
import { useDropzone } from 'react-dropzone';

import { CommonFileInputProps, FileInputState, FileValue } from 'src/types';

import { STEPS, StepType } from './useFilePicker.constants';
import { FILE_PICKER__CREATE_FILE_MUTATION } from './useFilePicker.gql';
import { FilePickerState, LocalFile } from './useFilePicker.types';

const uploadFile = (uploadUrl: string, file: File, onProgress: (progress: number) => void) => {
  return axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    }
  });
};


type UseFilePickerOptions = {
  uploadCallback: CommonFileInputProps['onUploadDone'];
  controlledValue: FileInputState['value'];
  onChange: CommonFileInputProps['onChange'];
};

export const useFilePicker = ({
  uploadCallback,
  errorCallback,
  controlledValue,
  onChange,
}: UseFilePickerOptions): FilePickerState => {
  const [fileList, setFileList] = useState<LocalFile[]>([]);
  const [fileProgressList, setFileProgressList] = useState<number[]>([]);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [step, setStep] = useState<StepType>(STEPS.select);
  const [createFile] = useMutation(FILE_PICKER__CREATE_FILE_MUTATION);
  const [options, setOptions] = useState<PickerOptions>({});
  const [value, setValue] = useState<FileInputState['value']>(controlledValue);
  const [originalFile, setOriginalFile] = useState<FileInputState['originalFile']>(null);
  const [error, setError] = useState<FileInputState['error']>(null);

  useEffect(() => {
    setValue(controlledValue);
  }, [controlledValue]);

  const addFiles = useCallback(
    (files: File[]) => {
      const filesWithLocalPath = files.map(file => {
        if (file.type.includes('image')) {
          return Object.assign(file, { localPath: URL.createObjectURL(file) });
        }

        return Object.assign(file, { localPath: undefined });;
      });
      let newList = [...fileList, ...filesWithLocalPath];
      if (options && options.maxFiles) {
        newList = newList.slice(0, options.maxFiles);
      }

      setFileList(newList);
      setStep(STEPS.upload);
    },
    [fileList, options],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: addFiles,
    accept: options && options.accept ? options.accept : undefined,
    maxFiles: options && options.maxFiles ? options.maxFiles : undefined,
    maxSize: options && options.maxSize ? options.maxSize : undefined,
  });

  const showFilePicker = useCallback((pickerOptions: PickerOptions | undefined = {}) => {
    setOptions(pickerOptions);
    setFileList([]);
    setValue(null);
    setError(null);
    setOriginalFile(null);
    setStep(STEPS.select);
    setOpen(true);
  }, []);

  const hideFilePicker = useCallback(() => {
    if (step === STEPS.uploading) {
      return null;
    }
    if (step === STEPS.select) {
      setError(null);
    }

    setFileList([]);
    setStep(STEPS.select);
    setOpen(false);
  }, [step]);

  const setUploadMoreStep = useCallback(() => {
    setStep(STEPS.uploadMore);
  }, []);

  const setUploadStep = useCallback(() => {
    setStep(STEPS.upload);
  }, []);

  const removeFile = useCallback(
    file => () => {
      const newFileList = [...fileList];
      const indexToRemove = newFileList.indexOf(file);
      if (indexToRemove !== -1) {
        newFileList.splice(indexToRemove, 1);

        if (newFileList.length === 0) {
          setStep(STEPS.select);
        }

        setFileList([...newFileList]);
      }
    },
    [fileList],
  );

  const onProgress = useCallback(
    (list) => {
      let currentList = [...list];
      return (index: number) => (progress: number) => {
        const newList = [...currentList];
        //console.log(newList);
        newList[index] = progress;
        currentList = [...newList];
        setFileProgressList(newList);
      }
    },
    [],
  );

  const handleUploadDone = useCallback(
    (filesUploaded: FileValue[], file: File[]) => {
      //console.log("🚀 ~ newValue:", filesUploaded)
      let newValue: FileInputState['value'] = [...filesUploaded];
      //console.log("🚀 ~ newValue:", newValue)
      let newOriginalFile: FileInputState['originalFile'] = [...file];
      //console.log("🚀 ~ newOriginalFile:", newOriginalFile)
      
      const { maxFiles } = options;

      //console.log("🚀 ~ newOriginalFile:", maxFiles)
      //console.log("🚀 ~ options:", options)

      if (maxFiles === 1) {
        newValue = newValue[0];
        newOriginalFile = newOriginalFile[0];
      }

      setValue(newValue);
      setOriginalFile(newOriginalFile);

      if (typeof uploadCallback === 'function') {
        uploadCallback && uploadCallback(newValue, newOriginalFile);
      }

      if (typeof onChange === 'function') {
        onChange(newValue, newOriginalFile);
      }

      hideFilePicker();
    },
    [options, uploadCallback, hideFilePicker],
  );

  const upload = useCallback(( useFilestack, workspace, apiKey, uploadHost, environment ) => {

    //console.log("🚀 ~ upload ~ workspace:", workspace)
    //console.log("🚀 ~ upload ~ apiKey:", apiKey)
    //console.log("🚀 ~ upload ~ uploadHost:", uploadHost)
    //console.log("🚀 ~ upload ~ environment:", environment)

    const newProgressList = fileList.map(el => 0);
    setFileProgressList(newProgressList);
    setStep(STEPS.uploading);

    if (fileList.length === 0) {
      hideFilePicker();
    }

    const uploadedFileList: FileValue[] = [];
    const failedFileList: FileValue[] = [];
    const uploadedOriginalFileList: File[] = [];

    const handleProgress = onProgress(newProgressList);
    //console.log(fileList);
    const loadFiles = fileList.map((file, index) => {
      const formdata = new FormData();
      if (useFilestack) {
        return createFile({
          variables: {
            data: {
              filename: file.name,
            },
          },
        }).then(async ({ data }) => {
          const { id, uploadUrl, downloadUrl, fileId, filename, public: isPublic } = data.fileCreate;
          const res = await uploadFile(uploadUrl, file, handleProgress(index));
  
          if (res.status === 200) {
            uploadedFileList.push({
              id,
              downloadUrl,
              fileId,
              filename,
              mimetype: file.type,
              public: isPublic,
            });
            uploadedOriginalFileList.push(file);
          } else {
            failedFileList.push({
              id,
              downloadUrl,
              fileId,
              filename,
              mimetype: file.type,
              public: isPublic,
            });
          }
        });
      } else {
        const actualUploadHost = uploadHost || 'https://file-manager.8base.com';
        formdata.append('files', file, file.name);
        return axios.post(actualUploadHost + '/upload', formdata, {
          headers: {
            'authorization': apiKey,
            'workspace': workspace,
            'environment': environment,
            'storage-provider': 'S3'
          }
        })
        .then(response => {
          if (response.status === 200) {
            uploadedFileList.push({
              id: response.data.data[0].fileId,
              downloadUrl: response.data.data[0].downloadUrl,
              fileId: response.data.data[0].fileId,
              filename: response.data.data[0].filename,
              mimetype: file.type,
              public: response.data.data[0].public,
            });
          } else {
            //console.log('uploaded file with error', file)
          }
        })
        .catch(error => {        
          setError(error.response.data.error);                   
          setStep(STEPS.error);    
          errorCallback(error.response.data.error); 
        });
      }
    });
    Promise.all(loadFiles)
      .then(() => handleUploadDone(uploadedFileList, uploadedOriginalFileList))
      .catch(setError);
  }, [createFile, fileList, hideFilePicker, onProgress, handleUploadDone]);

  return {
    fileList,
    fileProgressList,
    setFileList,
    isOpen,
    hideFilePicker,
    showFilePicker,
    addFiles,
    removeFile,
    step,
    setStep,
    setUploadMoreStep,
    setUploadStep,
    upload,
    getRootProps,
    getInputProps,
    options,
    value,
    originalFile,
    error,
  };
};
