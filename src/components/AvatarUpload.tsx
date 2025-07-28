/**
 * Avatar Upload Component
 * 
 * A comprehensive avatar upload component with drag-and-drop functionality,
 * progress tracking, and image preview. Integrates with Supabase Storage.
 * 
 * Key Features:
 * - Drag and drop file upload
 * - Click to select file
 * - Image preview before upload
 * - Upload progress tracking
 * - File validation with user feedback
 * - Mobile-responsive design
 * 
 * @author BizGenius Team
 * @version 1.0.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Loader2, X, Check } from 'lucide-react';
import { storageService, type UploadResult } from '../lib/storage';

/**
 * Avatar Upload Props Interface
 */
interface AvatarUploadProps {
  currentAvatar?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

/**
 * AvatarUpload Component
 * 
 * Main component for handling avatar image uploads with a modern,
 * user-friendly interface.
 */
export default function AvatarUpload({
  currentAvatar,
  onUploadSuccess,
  onUploadError,
  className = ''
}: AvatarUploadProps) {
  // Component state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle File Selection
   * 
   * Processes selected files and creates preview
   * 
   * @param file - Selected image file
   */
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onUploadError('File size must be less than 5MB');
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  }, [onUploadError]);

  /**
   * Handle File Upload
   * 
   * Uploads the selected file to Supabase Storage
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result: UploadResult = await storageService.uploadAvatar(
        selectedFile,
        (progress) => setUploadProgress(progress)
      );

      if (result.success && result.url) {
        onUploadSuccess(result.url);
        setPreviewUrl(null);
        setSelectedFile(null);
      } else {
        onUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Handle Drag Events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  /**
   * Handle File Input Change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Cancel Upload
   */
  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadProgress(0);
  };

  /**
   * Open File Selector
   */
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Avatar Display */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={previewUrl || currentAvatar || `https://ui-avatars.com/api/?name=User&background=6366f1&color=ffffff&size=96`}
            alt="Profile"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-200"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="text-white text-xs font-medium">
                {uploadProgress}%
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">Profile Photo</h3>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, WebP or GIF. Max size 5MB.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {!selectedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileSelector}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              {isDragging ? (
                <Upload className="h-6 w-6 text-blue-500" />
              ) : (
                <Camera className="h-6 w-6 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragging ? 'Drop image here' : 'Upload new photo'}
              </p>
              <p className="text-xs text-gray-500">
                Drag and drop or click to select
              </p>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      )}

      {/* Preview and Upload Controls */}
      {selectedFile && (
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <img
                src={previewUrl!}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-900 font-medium">{uploadProgress}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Upload Photo</span>
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}