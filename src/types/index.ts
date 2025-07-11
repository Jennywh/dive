export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

export interface DiveLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

export interface DivePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt: Date;
  fileName: string;
  size: number;
}

export interface DiveLog {
  id: string;
  userId: string;
  user: {
    displayName: string;
    photoURL?: string;
  };
  title: string;
  description?: string;
  location: DiveLocation;
  date: Date;
  depth?: number; // in meters
  duration?: number; // in minutes
  visibility?: number; // in meters
  waterTemp?: number; // in celsius
  photos: DivePhoto[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  diveCount: number;
  lastDiveDate: Date;
  photos: string[]; // Array of photo URLs for preview
} 