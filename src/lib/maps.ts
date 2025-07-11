import { Loader } from '@googlemaps/js-api-loader';

let googleMapsPromise: Promise<typeof google> | null = null;

export const loadGoogleMaps = async (): Promise<typeof google> => {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured. Please check your environment variables.');
  }

  const loader = new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['places', 'geometry', 'marker'],
  });

  try {
    googleMapsPromise = loader.load();
    const google = await googleMapsPromise;
    return google;
  } catch (error) {
    googleMapsPromise = null; // Reset promise so we can retry
    throw error;
  }
};

// Default map center (Great Barrier Reef, Australia - popular diving location)
export const DEFAULT_MAP_CENTER = {
  lat: -16.3,
  lng: 145.8,
};

// Map ID required for Advanced Markers
export const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

// Map styling for a cleaner look
export const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

// Geocoding helper functions
export const geocodeAddress = async (address: string): Promise<google.maps.LatLng | null> => {
  try {
    await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();
    
    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });

    return result[0]?.geometry?.location || null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<string | null> => {
  try {
    await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();
    const latlng = new google.maps.LatLng(lat, lng);

    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });

    // Return the formatted address of the first result
    return result[0]?.formatted_address || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

// Calculate distance between two points (in kilometers)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Check if coordinates are valid
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
};

// Create a bounds object from an array of positions
export const createBounds = (positions: { lat: number; lng: number }[]): google.maps.LatLngBounds | null => {
  if (positions.length === 0) return null;

  const bounds = new google.maps.LatLngBounds();
  positions.forEach(pos => {
    bounds.extend(new google.maps.LatLng(pos.lat, pos.lng));
  });
  
  return bounds;
}; 