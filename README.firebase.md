# Firebase Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
# Get these values from your Firebase Console > Project Settings > General > Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps API Key
# Get this from Google Cloud Console > APIs & Services > Credentials
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Firebase Services Setup

This project uses the following Firebase services:
- **Authentication**: For user login/registration
- **Firestore**: For storing dive logs and metadata
- **Storage**: For storing dive photos

## Setup Steps

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password and Google providers
3. Create a Firestore database in production mode
4. Enable Firebase Storage
5. Copy the configuration values to your `.env.local` file
6. Set up Google Maps API key in Google Cloud Console
7. Configure security rules (see below)

## Security Rules

### Firestore Security Rules

Create the following security rules in Firestore to allow authenticated users to read and write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read all dive logs but only write their own
    match /diveLogs/{diveLogId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Allow creation of new dive logs
    match /diveLogs/{diveLogId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Firebase Storage Security Rules

Create the following security rules in Firebase Storage to allow photo uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload photos to their own folder
    match /dive-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow public read access to all dive photos (for sharing)
    match /dive-photos/{userId}/{allPaths=**} {
      allow read: if true;
    }
    
    // Allow authenticated users to upload profile photos
    match /profile-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow public read access to profile photos
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if true;
    }
    
    // Validation rules for image uploads
    function isValidImageUpload() {
      return request.resource.size < 10 * 1024 * 1024 // 10MB limit
        && request.resource.contentType.matches('image/.*');
    }
    
    // Enhanced rules with validation
    match /dive-photos/{userId}/{allPaths=**} {
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && isValidImageUpload();
    }
    
    match /profile-photos/{userId}/{allPaths=**} {
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && isValidImageUpload();
    }
  }
}
```

### Deploying Security Rules

**Option 1: Firebase Console (Recommended)**
1. Go to Firebase Console → Firestore → Rules
2. Copy and paste the Firestore rules above
3. Click "Publish"
4. Go to Firebase Console → Storage → Rules
5. Copy and paste the Storage rules above
6. Click "Publish"

**Option 2: Firebase CLI**
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore storage`
4. Deploy: `firebase deploy --only firestore,storage` 