'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const { currentUser } = useAuth();

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  // Close modal when user successfully authenticates
  useEffect(() => {
    if (currentUser && isOpen) {
      onClose();
    }
  }, [currentUser, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Form Content */}
        <div className="p-6">
          {mode === 'login' ? (
            <LoginForm onToggleMode={toggleMode} />
          ) : (
            <SignupForm onToggleMode={toggleMode} />
          )}
        </div>
      </div>
    </div>
  );
}; 