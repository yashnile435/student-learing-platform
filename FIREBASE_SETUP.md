# Firebase Setup Guide

This guide will help you properly configure Firebase for the YATI learning platform.

## Prerequisites
- A Google account
- Access to [Firebase Console](https://console.firebase.google.com/)

## Step 1: Enable Authentication Methods

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `learning-platform-e12be`
3. Click on **Authentication** in the left sidebar
4. Click on the **Sign-in method** tab
5. Enable the following providers:

### Email/Password Authentication
- Click on **Email/Password**
- Toggle **Enable** to ON
- Click **Save**

### Google Authentication
- Click on **Google**
- Toggle **Enable** to ON
- Enter a support email (your email)
- Click **Save**

### Anonymous Authentication (for testing)
- Click on **Anonymous**
- Toggle **Enable** to ON
- Click **Save**

## Step 2: Configure Firestore Database

1. In Firebase Console, click on **Firestore Database** in the left sidebar
2. If you haven't created a database yet:
   - Click **Create database**
   - Choose **Start in test mode** (for development)
   - Select a location (choose closest to your users)
   - Click **Enable**

## Step 3: Update Firestore Security Rules

1. In Firestore Database, click on the **Rules** tab
2. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow read/write to test_connectivity for testing
    match /test_connectivity/{document=**} {
      allow read, write: if true;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own data
      allow read: if request.auth != null && request.auth.uid == userId;
      // Users can create their own document on signup
      allow create: if request.auth != null && request.auth.uid == userId;
      // Users can update their own data
      allow update: if request.auth != null && request.auth.uid == userId;
      // Admins can read all users
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Courses collection
    match /courses/{courseId} {
      // Anyone authenticated can read courses
      allow read: if request.auth != null;
      // Only admins can create/update/delete courses
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Enrollments collection
    match /enrollments/{enrollmentId} {
      // Users can read their own enrollments
      allow read: if request.auth != null;
      // Users can create enrollments
      allow create: if request.auth != null;
      // Admins can read all enrollments
      allow read, write: if request.auth != null && 
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish** to save the rules

## Step 4: Verify Configuration

1. Run the application: `npm start`
2. Navigate to: `http://localhost:3000/test`
3. You should see all tests passing:
   - ✅ Initialize Firebase
   - ✅ Authentication (Anonymous)
   - ✅ Firestore Write
   - ✅ Firestore Read

## Step 5: Create First Admin User

1. Navigate to: `http://localhost:3000/setup-admin`
2. Create an admin account with:
   - Email
   - Password
   - Name
3. This will create the first admin user in the system

## Troubleshooting

### Error: auth/admin-restricted-operation
- **Solution**: Enable Email/Password authentication in Firebase Console

### Error: auth/unauthorized-domain
- **Solution**: Add `localhost` to authorized domains in Firebase Console → Authentication → Settings → Authorized domains

### Error: firestore/permission-denied
- **Solution**: Update Firestore security rules as shown in Step 3

### Error: Failed to fetch / Network Error
- **Solution**: Check your internet connection and verify Firebase config in `src/firebase.js`

## Security Notes

⚠️ **Important**: The rules above are for development. For production:
1. Remove the test_connectivity rule
2. Add more specific validation rules
3. Implement rate limiting
4. Add data validation
5. Consider using Firebase App Check

## Features Implemented

✅ **Email/Password Authentication**
- User signup and login
- Password-based authentication

✅ **Google OAuth Authentication**
- One-click Google sign-in
- Automatic user profile creation

✅ **Realtime Login Tracking**
- Last login timestamp
- Device information (browser, OS, device type)
- User agent tracking

✅ **User Roles**
- Student role (default)
- Admin role (for management)

✅ **Firestore Data Structure**
```
users/{userId}
  - uid: string
  - email: string
  - name: string
  - role: 'student' | 'admin'
  - createdAt: ISO timestamp
  - lastLogin: ISO timestamp
  - lastLoginDevice: {
      browser: string
      os: string
      deviceType: string
      userAgent: string
    }
```

## Next Steps

1. Test user signup at `/signup`
2. Test user login at `/login`
3. Test Google login
4. Access dashboard at `/dashboard`
5. Access admin panel at `/admin` (admin users only)
