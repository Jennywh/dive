'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserProfileModal } from '@/components/auth/UserProfileModal';
import { DiveMap } from '@/components/map/DiveMap';
import { DiveLogForm } from '@/components/forms/DiveLogForm';
import { getRecentDiveLogs, getDiveLogs, deleteDiveLog } from '@/lib/firestore';
import { DiveLog } from '@/types';
import { 
  Plus, 
  User, 
  LogOut, 
  Waves, 
  Camera, 
  Calendar,
  MapPin,
  Menu,
  X,
  Trash2,
  Filter,
  Settings,
  ChevronDown
} from 'lucide-react';

export default function HomePage() {
  const { currentUser, loading: authLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiveForm, setShowDiveForm] = useState(false);
  const [diveLogs, setDiveLogs] = useState<DiveLog[]>([]);
  const [selectedDiveId, setSelectedDiveId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnlyMyDives, setShowOnlyMyDives] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Load dive logs
  useEffect(() => {
    const loadDiveLogs = async () => {
      try {
        setLoading(true);
        let logs: DiveLog[];
        
        if (showOnlyMyDives && currentUser) {
          logs = await getDiveLogs(currentUser.uid);
        } else {
          logs = await getRecentDiveLogs(100);
        }
        
        setDiveLogs(logs);
      } catch (error) {
        console.error('Error loading dive logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDiveLogs();
  }, [showOnlyMyDives, currentUser]);

  // Close auth modal when user successfully logs in
  useEffect(() => {
    if (currentUser && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [currentUser, showAuthModal]);

  // Reset filter when user logs out
  useEffect(() => {
    if (!currentUser && showOnlyMyDives) {
      setShowOnlyMyDives(false);
    }
  }, [currentUser, showOnlyMyDives]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown && !(event.target as Element).closest('.relative')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  const handleDiveLogCreated = (newDiveLog: DiveLog) => {
    setDiveLogs(prev => [newDiveLog, ...prev]);
    setShowDiveForm(false);
    setSelectedDiveId(newDiveLog.id);
  };

  const handleMarkerClick = (diveLog: DiveLog) => {
    setSelectedDiveId(diveLog.id);
    setSidebarOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteDive = async (diveId: string) => {
    const selectedDive = diveLogs.find(dive => dive.id === diveId);
    const photoCount = selectedDive?.photos?.length || 0;
    
    const confirmMessage = photoCount > 0 
      ? `Are you sure you want to delete this dive and its ${photoCount} photo${photoCount !== 1 ? 's' : ''}? This action cannot be undone.`
      : 'Are you sure you want to delete this dive? This action cannot be undone.';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      await deleteDiveLog(diveId);
      // Remove the dive from the local state
      setDiveLogs(prev => prev.filter(dive => dive.id !== diveId));
      // Clear selection if the deleted dive was selected
      if (selectedDiveId === diveId) {
        setSelectedDiveId(undefined);
      }
    } catch (error) {
      console.error('Error deleting dive:', error);
      alert('Failed to delete dive and photos. Please try again.');
    }
  };

  const selectedDive = diveLogs.find(dive => dive.id === selectedDiveId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden mr-3 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center">
                <Waves className="h-8 w-8 text-blue-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">DiveShare</h1>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {authLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              ) : currentUser ? (
                <>
                  <button
                    onClick={() => setShowDiveForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Log Dive</span>
                  </button>
                  
                  {/* User Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 hidden sm:block">
                        {currentUser.displayName}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                        <button
                          onClick={() => {
                            setShowProfileModal(true);
                            setShowUserDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Profile Settings
                        </button>
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowUserDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 fixed md:relative z-30 w-80 bg-white shadow-lg transition-transform duration-300 ease-in-out
        `}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Dives
                </h2>
                <div className="text-sm text-gray-500">
                  {diveLogs.length} total
                </div>
              </div>
              
              {/* Filter Toggle */}
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => setShowOnlyMyDives(!showOnlyMyDives)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      showOnlyMyDives
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showOnlyMyDives ? 'My Dives' : 'All Dives'}
                  </button>
                </div>
              )}
            </div>

            {/* Dive List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ) : diveLogs.length === 0 ? (
                <div className="p-4 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">No dive logs yet</p>
                  {currentUser && (
                    <button
                      onClick={() => setShowDiveForm(true)}
                      className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
                    >
                      Log your first dive
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {diveLogs.map((dive) => (
                    <div
                      key={dive.id}
                      onClick={() => {
                        setSelectedDiveId(dive.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedDiveId === dive.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      {/* Dive Photo */}
                      {dive.photos.length > 0 && (
                        <img
                          src={dive.photos[0].url}
                          alt={dive.title}
                          className="w-full h-32 object-cover rounded-md mb-2"
                        />
                      )}
                      
                      {/* Dive Info */}
                      <h3 className="font-medium text-gray-900 mb-1">
                        {dive.title}
                      </h3>
                      
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {dive.location.name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {dive.date.toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Camera className="h-3 w-3 mr-1" />
                          {dive.photos.length} photo{dive.photos.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {dive.user.displayName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative">
          {/* Map */}
          <div className="flex-1 min-h-0">
            <DiveMap
              diveLogs={diveLogs}
              onMarkerClick={handleMarkerClick}
              selectedDiveId={selectedDiveId}
              height="100%"
              className="w-full h-full"
            />
          </div>

          {/* Selected Dive Details */}
          {selectedDive && (
            <div className="absolute bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto z-10">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDive.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {/* Delete button - only show if user owns this dive */}
                  {currentUser && selectedDive.userId === currentUser.uid && (
                    <button
                      onClick={() => handleDeleteDive(selectedDive.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50"
                      title="Delete dive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDiveId(undefined)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Photos */}
              {selectedDive.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {selectedDive.photos.slice(0, 4).map((photo, index) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt={photo.caption || `Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                  ))}
                  {selectedDive.photos.length > 4 && (
                    <div className="col-span-2 text-center text-sm text-gray-500">
                      +{selectedDive.photos.length - 4} more photos
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {selectedDive.location.name}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {selectedDive.date.toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {selectedDive.user.displayName}
                </div>
                
                {selectedDive.description && (
                  <p className="text-gray-700 mt-2">
                    {selectedDive.description}
                  </p>
                )}

                {/* Dive Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                  {selectedDive.depth && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {selectedDive.depth}m
                      </div>
                      <div className="text-xs text-gray-500">Max Depth</div>
                    </div>
                  )}
                  {selectedDive.duration && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {selectedDive.duration}min
                      </div>
                      <div className="text-xs text-gray-500">Duration</div>
                    </div>
                  )}
                  {selectedDive.visibility && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {selectedDive.visibility}m
                      </div>
                      <div className="text-xs text-gray-500">Visibility</div>
                    </div>
                  )}
                  {selectedDive.waterTemp && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {selectedDive.waterTemp}°C
                      </div>
                      <div className="text-xs text-gray-500">Water Temp</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Welcome Message for non-authenticated users */}
          {!currentUser && (
            <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-6 text-center z-10">
              <Waves className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to DiveShare
              </h2>
              <p className="text-gray-600 mb-4">
                Discover amazing scuba diving locations and share your underwater adventures with the diving community.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showDiveForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDiveForm(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <DiveLogForm
                onSuccess={handleDiveLogCreated}
                onCancel={() => setShowDiveForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
