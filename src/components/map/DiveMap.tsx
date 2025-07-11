'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps, DEFAULT_MAP_CENTER, MAP_STYLES, createBounds, MAP_ID } from '@/lib/maps';
import { DiveLog } from '@/types';
import { MapPin, Camera } from 'lucide-react';

interface DiveMapProps {
  diveLogs: DiveLog[];
  onMarkerClick?: (diveLog: DiveLog) => void;
  selectedDiveId?: string;
  className?: string;
  height?: string;
}

export const DiveMap: React.FC<DiveMapProps> = ({
  diveLogs,
  onMarkerClick,
  selectedDiveId,
  className = '',
  height = '400px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // The ref should be available immediately now
        if (!mapRef.current) {
          setError('Map container not found. Please refresh the page.');
          return;
        }

        await loadGoogleMaps();

        // Ensure the container has dimensions
        if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
          mapRef.current.style.width = '100%';
          mapRef.current.style.height = '100%';
          mapRef.current.style.minHeight = '400px';
        }

        const map = new google.maps.Map(mapRef.current, {
          zoom: 6,
          center: DEFAULT_MAP_CENTER,
          styles: MAP_STYLES,
          mapId: MAP_ID,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();

        // Force resize after a short delay to ensure proper rendering
        setTimeout(() => {
          if (map && mapRef.current) {
            google.maps.event.trigger(map, 'resize');
          }
        }, 100);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Map initialization error:', err);
        setError(`Failed to load map: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Create marker for a dive log
  const createMarker = useCallback((diveLog: DiveLog): google.maps.marker.AdvancedMarkerElement | null => {
    if (!mapInstanceRef.current) return null;

    // Create the marker content element
    const createMarkerContent = (isSelected = false) => {
      const size = isSelected ? 60 : 50;
      const borderWidth = isSelected ? 4 : 3;
      
      const container = document.createElement('div');
      container.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${isSelected ? '#EF4444' : '#FFFFFF'};
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
        ${isSelected ? 'box-shadow: 0 0 0 2px #EF4444, 0 4px 12px rgba(239,68,68,0.4);' : ''}
      `;

      if (diveLog.photos && diveLog.photos.length > 0) {
        // Create photo thumbnail
        const img = document.createElement('img');
        img.src = diveLog.photos[0].url;
        img.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        `;
        img.alt = diveLog.title;
        
        // Add photo count badge if multiple photos
        if (diveLog.photos.length > 1) {
          const badge = document.createElement('div');
          badge.style.cssText = `
            position: absolute;
            top: -2px;
            right: -2px;
            background: #EF4444;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
          `;
          badge.textContent = diveLog.photos.length.toString();
          container.appendChild(badge);
        }
        
        container.appendChild(img);
      } else {
        // Default marker for dives without photos
        container.style.background = 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        
        const icon = document.createElement('div');
        icon.innerHTML = `
          <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
            <path d="M12 2L9 5H11V10H13V5H15L12 2Z"/>
            <rect x="6" y="11" width="12" height="2"/>
            <rect x="6" y="14" width="12" height="2"/>
            <rect x="6" y="17" width="12" height="2"/>
          </svg>
        `;
        container.appendChild(icon);
      }

      return container;
    };

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: {
        lat: diveLog.location.lat,
        lng: diveLog.location.lng,
      },
      map: mapInstanceRef.current,
      title: diveLog.title,
      content: createMarkerContent(false),
    });

    // Store the createMarkerContent function on the marker for later use
    (marker as google.maps.marker.AdvancedMarkerElement & { updateContent?: (isSelected: boolean) => HTMLElement }).updateContent = createMarkerContent;

    // Add click listener
    marker.addListener('click', () => {
      if (onMarkerClick) {
        onMarkerClick(diveLog);
      }
      showInfoWindow(diveLog, marker);
    });

    return marker;
  }, [onMarkerClick]);

  // Show info window for a dive log
  const showInfoWindow = useCallback((diveLog: DiveLog, marker: google.maps.marker.AdvancedMarkerElement) => {
    if (!infoWindowRef.current) return;

    // Create photo gallery for the info window
    const photoGallery = diveLog.photos.length > 0 ? (() => {
      if (diveLog.photos.length === 1) {
        return `<img src="${diveLog.photos[0].url}" alt="${diveLog.title}" style="width: 240px; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />`;
      } else {
        const mainPhoto = `<img src="${diveLog.photos[0].url}" alt="${diveLog.title}" style="width: 240px; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />`;
        const thumbnails = diveLog.photos.slice(1, 4).map(photo => 
          `<img src="${photo.url}" alt="Dive photo" style="width: 56px; height: 56px; object-fit: cover; border-radius: 4px; margin-right: 4px; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);" />`
        ).join('');
        const moreCount = diveLog.photos.length > 4 ? `<div style="width: 56px; height: 56px; background: rgba(0,0,0,0.7); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">+${diveLog.photos.length - 4}</div>` : '';
        
        return `
          ${mainPhoto}
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            ${thumbnails}
            ${moreCount}
          </div>
        `;
      }
    })() : `
      <div style="width: 240px; height: 140px; background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%); border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center;">
        <svg style="width: 32px; height: 32px; color: white;" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
        </svg>
      </div>
    `;

    const content = `
      <div style="max-width: 260px; padding: 12px;">
        ${photoGallery}
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${diveLog.title}</h3>
        <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280; font-size: 14px;">
          <svg style="width: 16px; height: 16px; margin-right: 4px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
          <span style="word-break: break-word;">${diveLog.location.name}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280; font-size: 14px;">
          <svg style="width: 16px; height: 16px; margin-right: 4px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
          </svg>
          ${diveLog.date.toLocaleDateString()}
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280; font-size: 14px;">
          <svg style="width: 16px; height: 16px; margin-right: 4px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
          </svg>
          ${diveLog.photos.length} photo${diveLog.photos.length !== 1 ? 's' : ''}
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 8px; color: #6b7280; font-size: 14px;">
          <svg style="width: 16px; height: 16px; margin-right: 4px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          by ${diveLog.user.displayName}
        </div>
        ${diveLog.description ? `<p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.4; max-height: 60px; overflow: hidden;">${diveLog.description.length > 100 ? diveLog.description.substring(0, 100) + '...' : diveLog.description}</p>` : ''}
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  }, []);

  // Update markers when dive logs change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      marker.map = null;
    });
    markersRef.current = {};

    // Create new markers
    diveLogs.forEach(diveLog => {
      const marker = createMarker(diveLog);
      if (marker) {
        markersRef.current[diveLog.id] = marker;
      }
    });

    // Fit map to show all markers
    if (diveLogs.length > 0) {
      const positions = diveLogs.map(dive => dive.location);
      const bounds = createBounds(positions);
      if (bounds) {
        mapInstanceRef.current.fitBounds(bounds);
        
        // Set a maximum zoom level
        const listener = google.maps.event.addListener(mapInstanceRef.current, 'bounds_changed', () => {
          if (mapInstanceRef.current && mapInstanceRef.current.getZoom() && mapInstanceRef.current.getZoom()! > 15) {
            mapInstanceRef.current.setZoom(15);
          }
          google.maps.event.removeListener(listener);
        });
      }
    }
  }, [diveLogs, createMarker]);

  // Highlight selected marker
  useEffect(() => {
    // Reset all markers first
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const isSelected = id === selectedDiveId;
      const markerWithUpdate = marker as google.maps.marker.AdvancedMarkerElement & { updateContent?: (isSelected: boolean) => HTMLElement };
      if (markerWithUpdate.updateContent) {
        marker.content = markerWithUpdate.updateContent(isSelected);
      }
    });

    // Center map on selected marker
    if (selectedDiveId) {
      const selectedMarker = markersRef.current[selectedDiveId];
      if (selectedMarker && selectedMarker.position) {
        const position = selectedMarker.position;
        if (typeof position === 'object' && 'lat' in position && 'lng' in position) {
          const lat: number = typeof position.lat === 'function' ? position.lat() : position.lat;
          const lng: number = typeof position.lng === 'function' ? position.lng() : position.lng;
          mapInstanceRef.current?.panTo({ lat, lng });
        }
      }
    }
  }, [selectedDiveId]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Always render the map div so the ref can attach */}
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px', width: '100%', height: '100%' }} />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2 animate-pulse" />
            <p className="text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-red-400 mb-2" />
            <p className="text-red-600 text-sm px-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
      
      {/* Map overlay with dive count and photos */}
      {!isLoading && !error && diveLogs.length > 0 && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
          <div className="flex items-center text-sm text-gray-600">
            <Camera className="h-4 w-4 mr-1" />
            {diveLogs.length} dive{diveLogs.length !== 1 ? 's' : ''}
          </div>
          {(() => {
            const totalPhotos = diveLogs.reduce((sum, dive) => sum + dive.photos.length, 0);
            const divesWithPhotos = diveLogs.filter(dive => dive.photos.length > 0).length;
            if (totalPhotos > 0) {
              return (
                <div className="text-xs text-blue-600 mt-1">
                  {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} • {divesWithPhotos} with thumbnails
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
      
      {/* Legend */}
      {!isLoading && !error && (
        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
          <div className="text-xs text-gray-600 mb-2">Map Legend</div>
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white mr-2 flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 16">
                  <path d="M6 2L3 5H5V10H7V5H9L6 2Z"/>
                </svg>
              </div>
              Dive without photos
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-4 h-4 rounded-full border-2 border-white mr-2 overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600"></div>
              Photo thumbnails
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white mr-2"></div>
              Selected dive
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 