# 8base-file-manager

This package provides a simple tool for uploading files to a server or a custom s3 AWS service. Related with  [8base](https://8base.com/)

## Installation

You can install the package via yarn | npm:

```bash
yarn add @8base/file-manager
npm install @8base/file-manager --save
```

# Usage

1- Import the package using the following snippet when you want to use it in your project.

```js
import { FileInput } from '@8base/file-manager';
```
2- Create a new instance of the `FileManager` class and pass an object with the required configuration parameters. The available options are:

| Option | Type     | Description                                                |
| :-------- | :------- | :--------------------------------------------------------- |
| **apiKey** | `string` | Your 8base API key, can be found in your [profile](https://app.8base.com/#/settings) |
| **workspace** | `number` | The workspace id of the app you want to upload files to |
| **environment** | `string` | the environment id, if you don't know it, by default is 'Master' (default: https://api-eu-west-1.graph.8base.com/v0) |
| **useFilestack** | `boolean` | Set this option to true if you want to use [filestack](https://www.filestack.com/) as a storage provider |
| **useS3** | `boolean` | Set this option to true if you want to use AWS S3 service as a storage provider (default: false) |
| **maxFiles** | `string` | Number of  files that can be uploaded at once |
| **value** | `string` | value for the input field |
| **onChange** | `function` | callback function when file is selected |

3- You must have a apollo provider  in your app.jsx or index.jsx to use this package:

```js
const API_TOKEN = 'xxxxxxx-xxxx-xxxx-xxxx-xxxx'

// Create a middleware that adds the API token to the request headers
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: API_TOKEN ? `Bearer ${API_TOKEN}` : '',
    },
  };
});

const httpLink = createHttpLink({
  uri: `https://api.8base.com/<your-workspace-id>`,
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={ client }>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

## Important Notes
- You must pass the `apiKey` to your app in order for this package to work.
- You must configure first on your 8base backend workspace the settings related with the storage provider you want to use (see below).
    - If you don't have any workspace, create one and then go to the settings page and add a new app service:
    - [File Storage](https://app.8base.com/workspace/<your-workspace-id>/app-services/storageservice)


