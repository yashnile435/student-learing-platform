# 🔥 Fixing "Missing or insufficient permissions" Error

## ✅ Good News!
Your Firebase connectivity tests are **ALL PASSING**:
- ✅ Initialize Firebase
- ✅ Authentication (Anonymous)
- ✅ Firestore Write
- ✅ Firestore Read

## ❌ The Problem
The error "Missing or insufficient permissions" is appearing because:
1. The app is trying to read from Firestore collections (`users`, `videos`, `courses`) when you're **not logged in**
2. Your Firestore rules require authentication to read these collections
3. The Navbar or other components are trying to fetch data on page load

## 🛠️ Solution: Update Firestore Rules

You need to update your Firestore rules to be more permissive for testing. Here are **TWO options**:

### Option 1: Development Mode (Recommended for Testing)

**Use this for development/testing ONLY:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // DEVELOPMENT MODE - Allow all reads and writes for 30 days
    // ⚠️ WARNING: Remove this before production!
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 2, 27);
    }
  }
}
```

**How to apply:**
1. Go to Firebase Console → Firestore Database → Rules
2. Replace ALL rules with the above
3. Click "Publish"

This will allow your app to work immediately while you're developing.

---

### Option 2: Production-Ready Rules (Recommended for Deployment)

**Use this for production with proper security:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Test connectivity collection (remove in production)
    match /test_connectivity/{document=**} {
      allow read, write: if true;
    }
    
    // Users collection
    match /users/{userId} {
      // Allow users to read their own data
      allow read: if request.auth != null && request.auth.uid == userId;
      // Allow users to create their own document
      allow create: if request.auth != null && request.auth.uid == userId;
      // Allow users to update their own data
      allow update: if request.auth != null && request.auth.uid == userId;
      // Allow admins to read all users
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Videos collection - allow all authenticated users to read
    match /videos/{videoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Courses collection
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Enrollments collection
    match /enrollments/{enrollmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               (resource.data.userId == request.auth.uid ||
                                exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

---

## 🚀 Quick Fix Steps

### Step 1: Apply Development Rules
1. Open Firebase Console: https://console.firebase.google.com/
2. Select project: `learning-platform-e12be`
3. Go to: **Firestore Database** → **Rules** tab
4. Copy **Option 1** rules above
5. Paste and click **"Publish"**

### Step 2: Verify
1. Refresh your app at `http://localhost:3000`
2. The error should disappear
3. You should be able to navigate without errors

### Step 3: Test Login
1. Go to `/signup` and create an account
2. Login at `/login`
3. Access dashboard at `/dashboard`

---

## 🔍 Why This Happens

The error occurs because:

```
App Loads → Navbar tries to check user role → 
Firestore query to 'users' collection → 
No authentication yet → 
Rules deny access → 
"Missing or insufficient permissions" error
```

**The Fix:**
- Option 1: Allow all access temporarily (for development)
- Option 2: Modify components to handle unauthenticated state gracefully

---

## 📝 Additional Code Fix (Optional)

If you want to keep strict rules, update `AuthContext.js` to handle errors gracefully:

```javascript
// In AuthContext.js, wrap the Firestore call in try-catch
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role);
                }
            } catch (error) {
                console.log('User document not accessible yet:', error);
                // Set default role or handle gracefully
                setUserRole('student');
            }
            setUser(currentUser);
        } else {
            setUser(null);
            setUserRole(null);
        }
        setLoading(false);
    });

    return unsubscribe;
}, []);
```

---

## ✅ Recommended Action

**For immediate fix:** Use **Option 1** (Development Mode)
**For production:** Use **Option 2** (Production Rules)

After applying the rules, your app should work without the permission error!
