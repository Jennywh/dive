'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { validateImageFiles } from '@/lib/storage';

interface PhotoUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onFilesSelected,
  maxFiles = 10,
  className = '',
  isUploading = false,
  uploadProgress = 0,
}) => {
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('');
    
    // Validate files
    const validation = validateImageFiles(acceptedFiles);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    // Check max files limit
    if (acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setSelectedFiles(acceptedFiles);
    onFilesSelected(acceptedFiles);
  }, [maxFiles, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    onFilesSelected([]);
    setError('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the photos here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop photos here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              JPEG, PNG, WebP up to 10MB each (max {maxFiles} files)
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Selected Photos ({selectedFiles.length})
            </h3>
            <button
              onClick={clearAll}
              className="text-gray-500 hover:text-gray-700 text-sm"
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {file.name}
                </p>
              </div>
            ))}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading photos...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Info Message */}
          {!isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-700">
                📸 {selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} selected. 
                Photos will be uploaded when you save the dive log.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {selectedFiles.length === 0 && !isDragActive && (
        <div className="text-center py-8">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500">No photos selected yet</p>
        </div>
      )}
    </div>
  );
}; 