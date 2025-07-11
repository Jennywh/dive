import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { DiveLog, User, DivePhoto } from '@/types';

// Interface for Firestore photo data (with Timestamp instead of Date)
interface FirestorePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt: Timestamp;
  fileName: string;
  size: number;
}

// Interface for Firestore dive log data
interface FirestoreDiveLog {
  userId: string;
  user: {
    displayName: string;
    photoURL?: string;
  };
  title: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
    name: string;
    address?: string;
  };
  date: Timestamp;
  depth?: number;
  duration?: number;
  visibility?: number;
  waterTemp?: number;
  photos: FirestorePhoto[];
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  DIVE_LOGS: 'diveLogs',
} as const;

// Helper function to remove undefined values from an object recursively
const removeUndefinedValues = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
        // Recursively clean nested objects
        const cleanedNested = removeUndefinedValues(value as Record<string, unknown>);
        if (Object.keys(cleanedNested).length > 0) {
          (cleaned as Record<string, unknown>)[key] = cleanedNested;
        }
      } else {
        (cleaned as Record<string, unknown>)[key] = value;
      }
    }
  });
  return cleaned;
};

// User operations
export const createUser = async (userData: Omit<User, 'createdAt'>) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userData.uid);
    
    // Remove undefined values since Firestore doesn't accept them
    const cleanedUserData = removeUndefinedValues(userData);
    const userDoc = {
      ...cleanedUserData,
      createdAt: Timestamp.now(),
    };
    
    await setDoc(userRef, userDoc as DocumentData);
    return userData.uid;
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
    throw error;
  }
};



export const getUser = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Helper function to convert Firestore photo to DivePhoto
const convertFirestorePhoto = (photo: FirestorePhoto): DivePhoto => ({
  ...photo,
  uploadedAt: photo.uploadedAt?.toDate() || new Date(),
});

// Helper function to convert Firestore dive log to DiveLog
const convertFirestoreDiveLog = (id: string, data: FirestoreDiveLog): DiveLog => ({
  id,
  ...data,
  date: data.date?.toDate() || new Date(),
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
  photos: data.photos?.map(convertFirestorePhoto) || [],
});

// Dive log operations
export const createDiveLog = async (diveLogData: Omit<DiveLog, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = Timestamp.now();
    
    // Clean up undefined values
    const cleanedData = removeUndefinedValues({
      ...diveLogData,
      date: Timestamp.fromDate(diveLogData.date),
      createdAt: now,
      updatedAt: now,
      photos: diveLogData.photos.map(photo => ({
        ...photo,
        uploadedAt: Timestamp.fromDate(photo.uploadedAt),
      })),
    });
    
    const docRef = await addDoc(collection(db, COLLECTIONS.DIVE_LOGS), cleanedData as DocumentData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating dive log:', error);
    throw error;
  }
};

export const getDiveLogs = async (userId?: string): Promise<DiveLog[]> => {
  try {
    let q = query(
      collection(db, COLLECTIONS.DIVE_LOGS),
      orderBy('createdAt', 'desc')
    );

    if (userId) {
      q = query(
        collection(db, COLLECTIONS.DIVE_LOGS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreDiveLog;
      return convertFirestoreDiveLog(doc.id, data);
    });
  } catch (error) {
    console.error('Error getting dive logs:', error);
    throw error;
  }
};

export const getDiveLog = async (id: string): Promise<DiveLog | null> => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTIONS.DIVE_LOGS, id));
    if (docSnap.exists()) {
      const data = docSnap.data() as FirestoreDiveLog;
      return convertFirestoreDiveLog(docSnap.id, data);
    }
    return null;
  } catch (error) {
    console.error('Error getting dive log:', error);
    throw error;
  }
};

export const updateDiveLog = async (id: string, updates: Partial<DiveLog>) => {
  try {
    // Remove fields that need special handling
    const { date, photos, ...otherUpdates } = updates;
    
    const updateData: Record<string, unknown> = {
      ...otherUpdates,
      updatedAt: Timestamp.now(),
    };

    if (date) {
      updateData.date = Timestamp.fromDate(date);
    }

    if (photos) {
      updateData.photos = photos.map(photo => ({
        ...photo,
        uploadedAt: Timestamp.fromDate(photo.uploadedAt),
      }));
    }

    await updateDoc(doc(db, COLLECTIONS.DIVE_LOGS, id), updateData as DocumentData);
  } catch (error) {
    console.error('Error updating dive log:', error);
    throw error;
  }
};

export const deleteDiveLog = async (id: string) => {
  try {
    // First, get the dive log to retrieve its photos
    const diveLog = await getDiveLog(id);
    
    if (diveLog) {
      // Delete all photos from Storage first
      if (diveLog.photos && diveLog.photos.length > 0) {
        const { deletePhoto } = await import('./storage');
        
        // Delete all photos from Storage
        const deletePromises = diveLog.photos.map(photo => deletePhoto(photo.id));
        await Promise.all(deletePromises);
      }
    }
    
    // Then delete the dive log document from Firestore
    await deleteDoc(doc(db, COLLECTIONS.DIVE_LOGS, id));
  } catch (error) {
    console.error('Error deleting dive log:', error);
    throw error;
  }
};

// Get recent dive logs for map display
export const getRecentDiveLogs = async (limitCount: number = 50): Promise<DiveLog[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.DIVE_LOGS),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const diveLogs = querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreDiveLog;
      return convertFirestoreDiveLog(doc.id, data);
    });
    
    // Return limited results
    return diveLogs.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting recent dive logs:', error);
    // Return empty array if there's an error, so the app doesn't crash
    return [];
  }
}; 