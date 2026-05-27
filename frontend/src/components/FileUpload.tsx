import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
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

  if (uploadStatus === 'success') {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <p className="text-xs text-emerald-400 font-medium">File loaded! Upload another below.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer
          transition-all duration-200 overflow-hidden
          ${isDragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50'
          }
          ${uploadStatus === 'uploading' ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Background gradient on drag */}
        {isDragActive && (
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-violet-500/5 pointer-events-none" />
        )}

        <div className="relative flex flex-col items-center gap-2">
          {uploadStatus === 'uploading' ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
              <div>
                <p className="text-sm text-indigo-400 font-semibold">Processing…</p>
                <p className="text-xs text-slate-500 mt-0.5">Analyzing your data</p>
              </div>
            </>
          ) : (
            <>
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                ${isDragActive ? 'bg-indigo-500/20' : 'bg-slate-800'}
              `}>
                {isDragActive ? (
                  <FileText className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  {isDragActive ? 'Drop file here' : 'Upload data file'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  CSV · Excel · PDF · JSON
                </p>
                <p className="text-xs text-slate-600 mt-0.5">Max 50 MB</p>
              </div>
            </>
          )}
        </div>
      </div>

      {uploadStatus === 'error' && uploadError && (
        <div className="mt-2 flex items-start gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <span className="text-red-400 text-xs">⚠</span>
          <p className="text-xs text-red-400">{uploadError}</p>
        </div>
      )}
    </div>
  );
};
