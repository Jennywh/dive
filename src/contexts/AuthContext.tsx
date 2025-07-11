'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser, getUser } from '@/lib/firestore';
import { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth profile
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore (only include photoURL if it exists)
      const userData: Omit<User, 'createdAt'> = {
        uid: user.uid,
        email: user.email!,
        displayName,
        ...(user.photoURL && { photoURL: user.photoURL }),
      };
      
      await createUser(userData);
    } catch (error) {
      console.error('Signup error:', error);
      // Re-throw the error so the component can handle it
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore, if not create them
      const existingUser = await getUser(user.uid);
      if (!existingUser) {
        await createUser({
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'Anonymous User',
          photoURL: user.photoURL || undefined,
        });
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Always create user object from Firebase Auth data first
          const authUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'Anonymous User',
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: new Date(),
          };
          
          // Set user immediately to avoid loading state
          setCurrentUser(authUser);
          
          // Try to get/create user data in Firestore in background
          try {
            const userData = await getUser(firebaseUser.uid);
            if (userData) {
              setCurrentUser(userData);
            } else {
              try {
                await createUser(authUser);
              } catch (createError) {
                console.error('Error creating user document (but continuing with auth data):', createError);
              }
            }
          } catch (firestoreError) {
            console.error('Firestore error (continuing with Firebase Auth data only):', firestoreError);
            // We already set the user from Firebase Auth data, so we can continue
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Critical error in auth state change handler:', error);
        // If Firebase Auth user exists but we had an error, still set basic user info
        if (firebaseUser) {
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'Anonymous User',
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: new Date(),
          });
        } else {
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 