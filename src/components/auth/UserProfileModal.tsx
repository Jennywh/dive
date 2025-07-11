'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, User, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { validateImageFile } from '@/lib/storage';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateAvatar, updateDisplayName } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(currentUser?.displayName || '');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      setError('');
      setIsUploading(true);
      await updateAvatar(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    if (newDisplayName.trim() === currentUser?.displayName) {
      setIsEditingName(false);
      return;
    }

    try {
      setError('');
      setIsUpdatingName(true);
      await updateDisplayName(newDisplayName.trim());
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating display name:', error);
      setError('Failed to update display name. Please try again.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleCancelEdit = () => {
    setNewDisplayName(currentUser?.displayName || '');
    setIsEditingName(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <div className="relative">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center border-4 border-gray-200">
                    <User className="h-12 w-12 text-white" />
                  </div>
                )}
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                
                {/* Loading Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              
              {/* Click area */}
              <button
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="absolute inset-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Click to {currentUser?.photoURL ? 'change' : 'upload'} avatar
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, WebP up to 10MB
              </p>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            
            {isEditingName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your display name"
                  disabled={isUpdatingName}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateDisplayName}
                    disabled={isUpdatingName}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isUpdatingName ? 'Updating...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdatingName}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-gray-900">{currentUser?.displayName}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-blue-600 hover:text-blue-700 p-1"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Email Section (Read-only) */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="text-gray-900">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}; 