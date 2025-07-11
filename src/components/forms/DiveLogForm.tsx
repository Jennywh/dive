'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PhotoUpload } from '@/components/upload/PhotoUpload';
import { loadGoogleMaps, reverseGeocode } from '@/lib/maps';
import { createDiveLog } from '@/lib/firestore';
import { uploadPhotos } from '@/lib/storage';
import { DiveLog, DivePhoto, DiveLocation } from '@/types';
import { MapPin, Calendar, Gauge, Thermometer, Eye, Clock, Save, X } from 'lucide-react';

interface DiveLogFormProps {
  onSuccess?: (diveLog: DiveLog) => void;
  onCancel?: () => void;
  className?: string;
}

export const DiveLogForm: React.FC<DiveLogFormProps> = ({
  onSuccess,
  onCancel,
  className = '',
}) => {
  const { currentUser } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    depth: '',
    duration: '',
    visibility: '',
    waterTemp: '',
    tags: '',
  });

  const [location, setLocation] = useState<DiveLocation | null>(null);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize map
  React.useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMaps();
        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          zoom: 6,
          center: { lat: -16.3, lng: 145.8 }, // Great Barrier Reef
          streetViewControl: false,
        });

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            placeMarker(event.latLng);
          }
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading map:', error);
        setError('Failed to load map. Please refresh the page.');
      }
    };

    initMap();
  }, []);

  const placeMarker = async (latLng: google.maps.LatLng) => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Create new marker
    const marker = new google.maps.Marker({
      position: latLng,
      map: mapInstanceRef.current,
      title: 'Dive Location',
      draggable: true,
    });

    marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        updateLocation(event.latLng);
      }
    });

    markerRef.current = marker;
    updateLocation(latLng);
  };

  const updateLocation = async (latLng: google.maps.LatLng) => {
    const lat = latLng.lat();
    const lng = latLng.lng();

    try {
      const address = await reverseGeocode(lat, lng);
      setLocation({
        lat,
        lng,
        name: formData.title || 'Dive Site',
        address: address || undefined,
      });
    } catch (error) {
      console.error('Error getting address:', error);
      setLocation({
        lat,
        lng,
        name: formData.title || 'Dive Site',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update location name if title changes
    if (name === 'title' && location) {
      setLocation(prev => prev ? { ...prev, name: value || 'Dive Site' } : null);
    }
  };

  const handleFilesSelected = useCallback((files: File[]) => {
    setSelectedPhotoFiles(files);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('You must be logged in to create a dive log.');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title for your dive.');
      return;
    }

    if (!location) {
      setError('Please select a dive location on the map.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setUploadProgress(0);

      // Upload photos first if any are selected
      let photos: DivePhoto[] = [];
      if (selectedPhotoFiles.length > 0) {
        photos = await uploadPhotos(
          selectedPhotoFiles,
          currentUser.uid,
          (progress) => setUploadProgress(progress)
        );
      }

      const diveLogData = {
        userId: currentUser.uid,
        user: {
          displayName: currentUser.displayName,
          ...(currentUser.photoURL && { photoURL: currentUser.photoURL }),
        },
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        location,
        date: new Date(formData.date),
        depth: formData.depth ? parseFloat(formData.depth) : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        visibility: formData.visibility ? parseFloat(formData.visibility) : undefined,
        waterTemp: formData.waterTemp ? parseFloat(formData.waterTemp) : undefined,
        photos,
        tags: formData.tags
          ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : undefined,
      };

      const diveLogId = await createDiveLog(diveLogData);

      const completeDiveLog: DiveLog = {
        id: diveLogId,
        ...diveLogData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (onSuccess) {
        onSuccess(completeDiveLog);
      }
    } catch (error) {
      setError('Failed to create dive log. Please try again.');
      console.error('Error creating dive log:', error);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Log a New Dive</h2>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Dive Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Great Barrier Reef Morning Dive"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Dive Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your dive experience..."
          />
        </div>

        {/* Dive Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="depth" className="block text-sm font-medium text-gray-700 mb-1">
              Max Depth (m)
            </label>
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                id="depth"
                name="depth"
                value={formData.depth}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="18"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (min)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="45"
                min="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
              Visibility (m)
            </label>
            <div className="relative">
              <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="15"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="waterTemp" className="block text-sm font-medium text-gray-700 mb-1">
              Water Temp (°C)
            </label>
            <div className="relative">
              <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                id="waterTemp"
                name="waterTemp"
                value={formData.waterTemp}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="24"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="coral reef, turtle, night dive (comma separated)"
          />
        </div>

        {/* Location Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            Dive Location *
          </label>
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <div ref={mapRef} className="w-full h-64" />
          </div>
          {mapLoaded && (
            <p className="text-sm text-gray-500 mt-1">
              Click on the map to select your dive location
            </p>
          )}
          {location && (
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900">Selected Location:</p>
              <p className="text-sm text-blue-700">
                {location.name} {location.address && `- ${location.address}`}
              </p>
              <p className="text-xs text-blue-600">
                Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dive Photos</h3>
          <PhotoUpload 
            onFilesSelected={handleFilesSelected}
            isUploading={isSubmitting && selectedPhotoFiles.length > 0}
            uploadProgress={uploadProgress}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !currentUser || !location}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? (
              selectedPhotoFiles.length > 0 ? (
                `Uploading photos... ${Math.round(uploadProgress)}%`
              ) : (
                'Saving...'
              )
            ) : (
              'Save Dive Log'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 