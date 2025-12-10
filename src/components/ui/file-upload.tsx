'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, X, Image, Video, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface FileUploadProps {
  accept?: Accept;
  maxSize?: number; // in bytes
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  preview?: string | null;
  className?: string;
  label?: string;
  helperText?: string;
  error?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.mov'],
  },
  maxSize = 50 * 1024 * 1024, // 50MB default
  onFileSelect,
  onFileRemove,
  preview,
  className,
  label,
  helperText,
  error,
  children,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onFileRemove?.();
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-10 w-10 text-surface-500" />;
    if (selectedFile.type.startsWith('image/')) return <Image className="h-10 w-10 text-brand-500" />;
    if (selectedFile.type.startsWith('video/')) return <Video className="h-10 w-10 text-brand-500" />;
    return <FileText className="h-10 w-10 text-brand-500" />;
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-surface-300 mb-2">
          {label}
        </label>
      )}

      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-surface-700 bg-surface-800">
          {selectedFile?.type.startsWith('video/') ? (
            <video
              src={previewUrl}
              className="w-full h-64 object-cover"
              controls
            />
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-64 object-cover"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-surface-900/80 hover:bg-surface-900"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="p-3 border-t border-surface-700">
            <p className="text-sm text-surface-300 truncate">{selectedFile?.name}</p>
            <p className="text-xs text-surface-500">
              {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
            'border-surface-700 hover:border-brand-500/50',
            isDragActive && 'border-brand-500 bg-brand-500/10',
            error && 'border-red-500'
          )}
        >
          <input {...getInputProps()} />
          {children || (
            <div className="flex flex-col items-center">
              {getFileIcon()}
              <p className="mt-4 text-surface-300">
                {isDragActive ? (
                  'Drop your file here...'
                ) : (
                  <>
                    Drag & drop or <span className="text-brand-500">browse</span>
                  </>
                )}
              </p>
              <p className="mt-2 text-sm text-surface-500">
                Supports images and videos up to {maxSize / 1024 / 1024}MB
              </p>
            </div>
          )}
        </div>
      )}

      {fileRejections.length > 0 && (
        <p className="mt-2 text-sm text-red-400">
          File rejected. Please check the file type and size.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {helperText && !error && (
        <p className="mt-2 text-sm text-surface-500">{helperText}</p>
      )}
    </div>
  );
}
