# Firebase Storage Security Rules Setup

This guide explains how to set up Firebase Storage security rules for the DiveShare app.

## Storage Rules Overview

The `storage.rules` file contains security rules that:

1. **Allow authenticated users to upload photos to their own folders**
   - Users can only upload to `dive-photos/{their-uid}/` and `profile-photos/{their-uid}/`
   - Prevents users from uploading to other users' folders

2. **Allow public read access to all photos**
   - Anyone can view dive photos (for sharing functionality)
   - Profile photos are also publicly readable

3. **Enforce file validation**
   - Maximum file size: 10MB
   - Only image files are allowed
   - Content type must match `image/*`

## Deployment Options

### Option 1: Firebase Console (Recommended for beginners)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `dive-614ac` project
3. Navigate to **Storage** → **Rules**
4. Copy the contents of `storage.rules` file
5. Paste into the rules editor
6. Click **Publish**

### Option 2: Firebase CLI

1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```bash
   firebase init storage
   ```

4. Deploy the rules:
   ```bash
   firebase deploy --only storage
   ```

## Rule Structure Explanation

```javascript
// Users can upload to their own folder
match /dive-photos/{userId}/{allPaths=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Public read access for sharing
match /dive-photos/{userId}/{allPaths=**} {
  allow read: if true;
}

// File validation
function isValidImageUpload() {
  return request.resource.size < 10 * 1024 * 1024  // 10MB limit
    && request.resource.contentType.matches('image/.*');
}
```

## Testing the Rules

After deploying, test the rules by:

1. **Upload Test**: Try uploading a photo through the app
2. **Access Test**: Verify you can view uploaded photos
3. **Security Test**: Ensure users can't upload to other users' folders

## Troubleshooting

**403 Forbidden Error**
- Make sure the user is authenticated
- Check that the file path matches the rule pattern
- Verify the file is under 10MB and is an image

**Rules Not Taking Effect**
- Rules can take a few minutes to propagate
- Try refreshing the page
- Check the Firebase Console for rule deployment errors

## Path Structure

```
dive-photos/
  ├── {userId1}/
  │   ├── photo1.jpg
  │   └── photo2.png
  └── {userId2}/
      ├── photo3.jpg
      └── photo4.png

profile-photos/
  ├── {userId1}/
  │   └── avatar.jpg
  └── {userId2}/
      └── profile.png
```

This structure ensures users can only manage their own photos while allowing public access for sharing functionality. 