import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';
import { DivePhoto } from '@/types';

// Generate a unique filename
const generateUniqueFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || '';
  return `${userId}/${timestamp}_${randomString}.${extension}`;
};

// Upload a single photo
export const uploadPhoto = async (
  file: File,
  userId: string
): Promise<DivePhoto> => {
  try {
    const fileName = generateUniqueFileName(file.name, userId);
    const storageRef = ref(storage, `dive-photos/${fileName}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    const photo: DivePhoto = {
      id: fileName,
      url: downloadURL,
      fileName: file.name,
      size: file.size,
      uploadedAt: new Date(),
      caption: '',
    };

    return photo;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw new Error('Failed to upload photo');
  }
};

// Upload multiple photos
export const uploadPhotos = async (
  files: File[],
  userId: string,
  onProgress?: (progress: number) => void
): Promise<DivePhoto[]> => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const photo = await uploadPhoto(file, userId);
      if (onProgress) {
        const progress = ((index + 1) / files.length) * 100;
        onProgress(progress);
      }
      return photo;
    });

    const photos = await Promise.all(uploadPromises);
    return photos;
  } catch (error) {
    console.error('Error uploading photos:', error);
    throw new Error('Failed to upload photos');
  }
};

// Delete a photo from storage
export const deletePhoto = async (photoId: string): Promise<void> => {
  try {
    const storageRef = ref(storage, `dive-photos/${photoId}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw new Error('Failed to delete photo');
  }
};

// Upload user avatar
export const uploadAvatar = async (
  file: File,
  userId: string
): Promise<string> => {
  try {
    // Delete existing avatar if it exists
    try {
      await deleteAvatar(userId);
    } catch {
      // Ignore error if no existing avatar
    }
    
    const fileName = `${userId}/avatar.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `profile-photos/${fileName}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error('Failed to upload avatar');
  }
};

// Delete user avatar
export const deleteAvatar = async (userId: string): Promise<void> => {
  try {
    // Try different common extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (const ext of extensions) {
      try {
        const storageRef = ref(storage, `profile-photos/${userId}/avatar.${ext}`);
        await deleteObject(storageRef);
        break; // Stop if we successfully deleted one
      } catch {
        // Continue trying other extensions
      }
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw new Error('Failed to delete avatar');
  }
};

// Generate thumbnail URL (this would typically be done server-side with Cloud Functions)
export const generateThumbnailUrl = (url: string): string => {
  // For now, we'll use the original URL
  // In production, you'd want to generate actual thumbnails
  return url;
};

// Validate image file
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB',
    };
  }

  return { isValid: true };
};

// Validate multiple files
export const validateImageFiles = (files: File[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const validation = validateImageFile(files[i]);
    if (!validation.isValid) {
      errors.push(`File ${i + 1}: ${validation.error}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}; 