import {HTTPBatchedNetworkInterface} from 'apollo-client'
import {extractRequestFiles} from './helpers'

export class HTTPUploadBatchNetworkInterface extends HTTPBatchedNetworkInterface {
  batchedFetchFromRemoteEndpoint ({requests, options}) {
    // Skip upload proccess if SSR
    if (typeof window !== 'undefined') {
      // Extract any files from the request
      const batchFiles = []
      const batchOperations = requests.map((request, operationIndex) => {
        const {operation, files} = extractRequestFiles(request)
        batchFiles.push({
          operationIndex,
          files
        })
        return operation
      })

      // Only initiate a multipart form request if there are uploads
      if (batchFiles.length) {
        const formData = new window.FormData()
        formData.append('operations', JSON.stringify(batchOperations))
        batchFiles.forEach(({operationIndex, files}) => {
          files.forEach(({variablesPath, file}) => formData.append(`${operationIndex}.${variablesPath}`, file))
        })

        // Send request
        return window.fetch(this._uri, {
          method: 'POST',
          body: formData,
          ...options
        })
      }
    }

    // Standard fetch method fallback
    return super.batchedFetchFromRemoteEndpoint({requests, options})
  }
}

export function createBatchNetworkInterface ({uri, batchInterval, ...options}) {
  return new HTTPUploadBatchNetworkInterface(uri, batchInterval, options)
}