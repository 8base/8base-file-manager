// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, gql, ApolloError } from '@apollo/client';
import { FileInputValue, OriginalFileInputValue } from '../../types';
import { useDropzone } from 'react-dropzone';
import { COMMON_STYLES, CONTENT_STYLES, DROPZONE_STYLES } from './FileChooser.styles';
import { CloseIcon } from './CloseIcon'
import { DropzoneState } from 'react-dropzone';
import { PickerOptions } from 'filestack-js';
import { FILE_PREVIEW_STYLES } from './FilePicker.styles'
interface IFileChooserProps {
  maxFiles?: number;
  onUploadDone?: (value: FileInputValue, originalFile: OriginalFileInputValue) => Promise<FileInputValue>;
  onChange: (value: any, originalFile: File[]) => void;
  client?: any;
  value: any;
  workspace?: string;
  apiKey?: string;
  uploadHost?: string | 'http://localhost:3007';
  environment?: string
}

const FILE_UPLOAD_INFO_QUERY = gql`
  query FileUploadInfo {
    fileUploadInfo {
      policy
      signature
      apiKey
      path
    }
  }
`;

function FileChooser({
  maxFiles,
  onUploadDone,
  onChange,
  client,
  value,
  workspace,
  apiKey,
  uploadHost,
  environment,
  hideFilePicker,
}: IFileChooserProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [path, setPath] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [options, setOptions] = useState<PickerOptions>({});
  const [uploadMore, setUploadMoreStep] = useState<boolean>(false)

  const [error, setError] = useState<Error | null>(null);

  const { loading, error: queryError, data } = useQuery(FILE_UPLOAD_INFO_QUERY);

  useEffect(() => {
    console.log(data);
  }, []);

  const onDrop = (acceptedFiles: File[]) => {
    if (maxFiles && maxFiles > 1) {
      setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    } else {
      setFiles([acceptedFiles[0]]);
    }
  };

  const uploadToS3 = async (files: File[]) => {
    const headers = new Headers();
    setUploading(true);
    headers.append('storage-provider', 'S3');
    if (apiKey) {
      headers.append('authorization', apiKey);
    }
    if (workspace) {
      headers.append('workspace', workspace);
    }
    if (environment) {
      headers.append('environment', environment);
    }

    const formdata = new FormData();

    files.forEach(file => {
      formdata.append('files', file, file.name);
    });

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: headers,
      body: formdata,
      redirect: 'follow' as RequestRedirect,
    };

    try {
      const response = await fetch(uploadHost + '/upload', requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      setUploadProgress(100);

      return result.data;
    } catch (error) {
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    setUploadProgress(1);
    let value = await uploadToS3(files);
    const originalFile = files.map(item => item);
    if (maxFiles === 1) {
      value = value[0];
    }
    if (typeof onChange === 'function') {
      onChange(value, originalFile);
    }

    if (typeof onUploadDone === 'function') {
      onUploadDone(value, originalFile);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: options && options.accept ? options.accept : undefined,
    maxFiles: options && options.maxFiles ? options.maxFiles : undefined,
    maxSize: options && options.maxSize ? options.maxSize : undefined,
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  type FilePickerDropZoneProps = {
    getRootProps: DropzoneState['getRootProps'];
    getInputProps: DropzoneState['getInputProps'];
  };
  
  const shouldShowUploadMoreBtn = (options: FilePickerContentProps['options'], length: number) => {
    if (options && options.maxFiles) {
      return length < options.maxFiles;
    }
  
    return true;
  };
  
  const shouldShowUploadBtn = (options: FilePickerContentProps['options'], length: number) => {
    if (options && options.minFiles) {
      return length >= options.minFiles;
    }
  
    return true;
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      updatedFiles.splice(index, 1);
      return updatedFiles;
    });
  };

  return (
    <>
      <div className={CONTENT_STYLES.header}>
        <div className={CONTENT_STYLES.closeWrapper} onClick={hideFilePicker}>
          <CloseIcon />
        </div>
      </div>
      {/* <FilePickerDropZone getRootProps={getRootProps} getInputProps={getInputProps} /> */}
      <div className={DROPZONE_STYLES.wrapper} {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? <p style={{ color: '#000' }}>Drop the files here...</p> : <p style={{ color: '#000' }}>Drag and drop some files here, or click to select files</p>}
      </div>
      <>
        <div className={CONTENT_STYLES.header}>
          <div className={CONTENT_STYLES.headerTitle}>Selected Files</div>
        </div>
        <div className={CONTENT_STYLES.listWrapper}>
          {/* {files.length > 0 && memoizedRenderTableFields} */}
          {files.map((el, index) => (
            <div className={FILE_PREVIEW_STYLES.itemWrapper} key={index}>
              <img src={URL.createObjectURL(el)} alt={`Preview ${index}`} className={FILE_PREVIEW_STYLES.image} />
              <div className={FILE_PREVIEW_STYLES.details}>
                <span>{el.name}</span>
                <span>{uploadProgress > 0 && <p>Uploading... {uploadProgress}%</p>}</span>
              </div>
              <div className={FILE_PREVIEW_STYLES.removeWrapper} onClick={() => removeFile(index)}>
                <CloseIcon />
              </div>
            </div>
          ))}
        </div>
        <div className={CONTENT_STYLES.footer}>
          {shouldShowUploadBtn(options, files.length) && (
            <button className={COMMON_STYLES.button} onClick={handleUpload}>
              Upload
            </button>
          )}
        </div>
      </>
    </>
  );
};

export { FileChooser }