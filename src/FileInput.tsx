// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useQuery, gql } from '@apollo/client';
import * as filestack from 'filestack-js';
import { FileChooser } from './FileChooser';
import { FileInputValue } from './types';

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

function FileInput(props: any) {
  const [state, setState] = useState({
    error: null,
    originalFile: null,
    path: null,
    value: props.value || null,
    isModalOpen: false,
  });

  let filestack: any;
  let filestackPromise: Promise<void>;

  useEffect(() => {
    filestackPromise = initFilestack();
  }, []);
  
  const initFilestack = async () => {
    const { client, sessionCache } = props;

    let response = null;

    try {
      const { loading, error, data } = useQuery(FILE_UPLOAD_INFO_QUERY, {
        fetchPolicy: props.fetchPolicy
      });

      response = data;

    } catch (e) {
      setState({ ...state, error: e } as any);
      return;
    }

    const { apiKey, policy, signature, path } = response.data.fileUploadInfo;

    setState({ ...state, path });

    filestack = filestack.init(apiKey, {
      security: {
        policy,
        signature,
      },
      sessionCache,
    });
  };

  const openModal = () => {
    setState({ ...state, isModalOpen: true });
  };

  const closeModal = () => {
    setState({ ...state, isModalOpen: false });
  };

  const onUploadDone = async ({ filesUploaded }: any) => {
    if (!filestack) {
      return;
    }

    const { policy = '""', signature = '""' } = filestack.session;

    let value = filesUploaded.map(({ handle, filename, url, mimetype }: any) => {
      const urlOrigin = url ? new URL(url).origin : '';

      return {
        downloadUrl: `${urlOrigin}/security=p:${policy},s:${signature}/${handle}`,
        fileId: handle,
        filename,
        mimetype,
        public: !!props.public,
      };
    });

    let originalFile = filesUploaded.map((item: any) => item.originalFile);

    const { maxFiles, onUploadDone, onChange } = props;

    if (maxFiles === 1) {
      value = value[0];
      originalFile = originalFile[0];
    }

    if (typeof onUploadDone === 'function') {
      value = await onUploadDone(value, originalFile);
    }

    setState({ ...state, value, originalFile });

    if (typeof onChange === 'function') {
      onChange(value, originalFile);
    }
  };

  const collectPickerOptions = () => {
    const { maxFiles } = props;
    const { path } = state;

    return {
      exposeOriginalFile: true,
      maxFiles,
      onUploadDone: onUploadDone,
      storeTo: {
        path,
      },
    };
  };

  const pick = async (options = {}) => {
    await filestackPromise;

    if (!filestack) {
      return;
    }

    if ('maxFiles' in options) {
      console.warn('Specify "maxFiles" as a prop for FileInput component');
    }

    if ('onUploadDone' in options) {
      console.warn('Specify "onUploadDone" as a prop for FileInput component');
    }

    const pickerOptions = collectPickerOptions();

    const picker = filestack.picker({
      ...options,
      ...pickerOptions,
    });

    await picker.open();

    return picker;
  };
  
  const { children, useFilestack, onChange, maxFiles, apiKey, workspace, uploadHost, environment } = props;
  const { error, value, originalFile } = state;
  return (
    <>
      { filestack ? (
        props.children({ pick: pick(), value: state.value, originalFile: state.originalFile, error: state.error })
      ) : (
        <> 
          { props.children({ openModal: openModal, value, originalFile, error }) }
          {
            state.isModalOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 11999,
                }}
                  >
                    <div
                      style={{
                        background: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                      }}
                    >
  
                    <FileChooser
                      apiKey={apiKey}
                      workspace={workspace}
                      environment={environment}
                      uploadHost={uploadHost}
                      onUploadDone={async (item, _originalFile) => {
                        let result: FileInputValue = item;
                        if (typeof onUploadDone === 'function') {
                          result = await props.onUploadDone(item, originalFile);
                        }
                        setState(prevState => ({
                          ...prevState,
                          value: item,
                          originalFile: originalFile,
                        }));
                        closeModal();
                        return result;
                      } }
                      onChange={(value, originalFile) => {
                        if (typeof onChange === 'function') {
                          onChange(value, originalFile);
                        }
                      } }
                      maxFiles={maxFiles}
                      value={value} 
                    />
                      
                    <button
                      type="button"
                      onClick={() => closeModal()}
                      style={{
                        float: 'right',
                        bottom: '10px',
                        right: '10px',
                        padding: '8px',
                        background: '#0874F9',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                  </div>
              </div>
            )  
          }  
        </>
      )}
    </>
  )
}

export { FileInput }