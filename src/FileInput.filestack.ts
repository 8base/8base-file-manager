// @ts-nocheck
import React from 'react';
import { useQuery, gql, ApolloError } from '@apollo/client';
import * as filestack from 'filestack-js';
import { FilestackFileInputProps as FileInputProps, FileInputState } from './types';

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

// @ts-ignore
class FileInputFilestack extends React.Component<FileInputProps> {
  // @ts-ignore
  public static defaultProps = {
    maxFiles: 1,
    value: null,
    sessionCache: false,
  };

  public static getDerivedStateFromProps(props: FileInputProps, state: FileInputState) {
    let nextState = null;

    if (props.value !== state.value) {
      nextState = { value: props.value };
    }

    return nextState;
  }

  public filestack?: { [key: string]: any };
  public filestackPromise?: Promise<void>;

  constructor(props: FileInputProps) {
    super(props);

    this.state = {
      error: null,
      originalFile: null,
      path: null,
      value: props.value || null,
    };
  }

  public componentDidMount() {
    this.filestackPromise = this.initFilestack();
    if (this.props.fallbackOptions) {
      this.pick(this.props.fallbackOptions);
    }
  }

  public async initFilestack() {
    const { sessionCache } = this.props;

    let response = null;

    try {
      const { data, loading } = useQuery(FILE_UPLOAD_INFO_QUERY, {
        fetchPolicy: this.props.fetchPolicy
      });
      response = data;
    } catch (e) {
      // @ts-ignore
      this.setState({ error: e });

      return;
    }

    const { apiKey, policy, signature, path } = response.data.fileUploadInfo;

    this.setState({ path });

    this.filestack = filestack.init(apiKey, {
      security: {
        policy,
        signature,
      },
      sessionCache,
    });
  }

  public onUploadDone = async ({ filesUploaded }: any) => {
    if (!this.filestack) {
      return;
    }

    const { policy = '""', signature = '""' } = this.filestack.session;

    let value = filesUploaded.map(({ handle, filename, url, mimetype }: any) => {
      const urlOrigin = url ? new URL(url).origin : '';

      return {
        downloadUrl: `${urlOrigin}/security=p:${policy},s:${signature}/${handle}`,
        fileId: handle,
        filename,
        mimetype,
        public: !!this.props.public,
      };
    });

    let originalFile = filesUploaded.map((item: any) => item.originalFile);

    const { maxFiles, onUploadDone, onChange } = this.props;

    if (maxFiles === 1) {
      value = value[0];
      originalFile = originalFile[0];
    }

    if (typeof onUploadDone === 'function') {
      value = await onUploadDone(value, originalFile);
    }

    this.setState({ value, originalFile });

    if (typeof onChange === 'function') {
      onChange(value, originalFile);
    }
  };

  public collectPickerOptions = () => {
    const { maxFiles } = this.props;
    // @ts-ignore
    const { path } = this.state;

    return {
      exposeOriginalFile: true,
      maxFiles,
      onUploadDone: this.onUploadDone,
      storeTo: {
        path,
      },
    };
  };

  public pick = async (options = {}) => {
    await this.filestackPromise;

    if (!this.filestack) {
      return;
    }

    if ('maxFiles' in options) {
      console.warn('Specify "maxFiles" as a prop for FileInput component'); // tslint:disable-line
    }

    if ('onUploadDone' in options) {
      console.warn('Specify "onUploadDone" as a prop for FileInput component'); // tslint:disable-line
    }

    const pickerOptions = this.collectPickerOptions();

    const picker = this.filestack.picker({
      ...options,
      ...pickerOptions,
    });

    await picker.open();

    return picker;
  };

  public render() {
    const { children } = this.props;
    // @ts-ignore
    const { error, value, originalFile } = this.state;

    return children({ pick: this.pick, value, originalFile, error });
  }
}

export { FileInputFilestack };
