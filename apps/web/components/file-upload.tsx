'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, File, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  error?: string;
  estimatedTime?: string;
}

interface FileUploadProps {
  userId: string;
  onFileUploaded?: (file: UploadedFile) => void;
  onUploadComplete?: (file: UploadedFile) => void;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;
const ALLOWED_TYPES = {
  'application/pdf': ['.pdf'],
  'text/markdown': ['.md', '.markdown'],
  'text/plain': ['.txt'],
};

export function FileUpload({
  userId,
  onFileUploaded,
  onUploadComplete,
  maxFileSize = MAX_FILE_SIZE,
  maxFiles = MAX_FILES,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const pollJobStatus = useCallback(async (fileId: string, jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();

      if (data.success) {
        setFiles(prev => prev.map(file => {
          if (file.id === fileId) {
            return {
              ...file,
              status: data.job.state,
              error: data.job.failedReason,
            };
          }
          return file;
        }));

        if (data.job.state === 'completed') {
          onUploadComplete?.(files.find(f => f.id === fileId)!);
        } else if (data.job.state === 'failed') {
          console.error('Job failed:', data.job.failedReason);
        } else if (data.job.state === 'processing' || data.job.state === 'pending') {
          // Continue polling
          setTimeout(() => pollJobStatus(fileId, jobId), 2000);
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      setFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          return {
            ...file,
            status: 'failed',
            error: 'Failed to check job status',
          };
        }
        return file;
      }));
    }
  }, [files, onUploadComplete]);

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
    };

    setFiles(prev => [...prev, uploadedFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const updatedFile = {
          ...uploadedFile,
          status: 'processing' as const,
          jobId: data.jobId,
          estimatedTime: data.estimatedProcessingTime,
        };

        setFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
        onFileUploaded?.(updatedFile);

        // Start polling for job status
        setTimeout(() => pollJobStatus(fileId, data.jobId), 1000);

        return updatedFile;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      const errorFile = {
        ...uploadedFile,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Upload failed',
      };

      setFiles(prev => prev.map(f => f.id === fileId ? errorFile : f));
      return errorFile;
    }
  }, [userId, onFileUploaded, pollJobStatus]);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);

    // Upload files sequentially to avoid overwhelming the server
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);

    // Show rejected files
    if (rejectedFiles.length > 0) {
      const rejectedReasons = rejectedFiles.map(r => r.errors[0]?.message).filter(Boolean);
      if (rejectedReasons.length > 0) {
        alert(`Some files were rejected:\n${rejectedReasons.join('\n')}`);
      }
    }
  }, [files.length, maxFiles, uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: maxFileSize,
    multiple: true,
    disabled: isUploading || files.length >= maxFiles,
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      uploading: 'secondary',
      processing: 'outline',
      completed: 'default',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Upload PDF or Markdown files for processing and analysis. Maximum {formatFileSize(maxFileSize)} per file, {maxFiles} files total.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : isUploading || files.length >= maxFiles
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-primary hover:bg-primary/5'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop the files here...</p>
          ) : isUploading ? (
            <p className="text-lg font-medium">Uploading files...</p>
          ) : files.length >= maxFiles ? (
            <p className="text-lg font-medium">Maximum file limit reached</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF and Markdown files (.pdf, .md, .markdown, .txt)
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Uploaded Files ({files.length}/{maxFiles})</h4>
            {files.map((file) => (
              <Card key={file.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(file.status)}
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                        {file.estimatedTime && ` • Est. ${file.estimatedTime}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(file.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading' || file.status === 'processing'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {file.error && (
                  <Alert className="mt-2" variant="destructive">
                    <AlertDescription className="text-sm">
                      {file.error}
                    </AlertDescription>
                  </Alert>
                )}
                {file.status === 'processing' && (
                  <div className="mt-2">
                    <Progress value={undefined} className="h-2" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-500">
          <p>• Files will be processed automatically after upload</p>
          <p>• Processing time varies based on file size and complexity</p>
          <p>• You can search through processed documents once completed</p>
        </div>
      </CardContent>
    </Card>
  );
}