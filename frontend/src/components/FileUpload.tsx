import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

const ACCEPTED = {
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/pdf': ['.pdf'],
  'application/json': ['.json'],
};

export const FileUpload: React.FC = () => {
  const { uploadDataset, uploadStatus, uploadError } = useChatStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadDataset(acceptedFiles[0]!);
      }
    },
    [uploadDataset]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    disabled: uploadStatus === 'uploading',
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
          ${uploadStatus === 'uploading' ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-2">
          {uploadStatus === 'uploading' ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-blue-600 font-medium">Processing file...</p>
            </>
          ) : (
            <>
              {isDragActive ? (
                <FileText className="w-8 h-8 text-blue-500" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive ? 'Drop your file here' : 'Upload a data file'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  CSV, Excel, PDF, JSON · Max 50MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {uploadStatus === 'error' && uploadError && (
        <p className="mt-2 text-xs text-red-500">⚠️ {uploadError}</p>
      )}
    </div>
  );
};
