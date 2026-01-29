# 🔐 Authentication Design & Logic

This document outlines the authentication flow, ensuring user roles and progress data are correctly initialized and synchronized between Firebase Auth and Firestore.

## 1. Authentication Flow

The system uses a **Hybrid Auth Pattern**:
1.  **Identity Layer**: Firebase Auth handles credentials (Email/Pass, Google).
2.  **Data Layer**: Firestore `users` collection holds Authorization (Roles) and App State (Progress).

### 🔄 The Synchronization Lifecycle
1.  **User Logs In** (via Provider)
2.  **Trigger**: `onAuthStateChanged` detects the session.
3.  **Fetch**: Helper function `fetchUserProfile(uid)` queries `users/{uid}`.
4.  **Sync State**:
    *   Set `currentUser` (Auth Object).
    *   Set `userRole` (from Firestore, default 'student').
    *   Set `userProfile` (optional, for names/avatars).

---

## 2. Firestore Document Structure

When a user is created, this **Exact Structure** MUST be written to Firestore to satisfy the requirements.

**Path:** `users/{uid}`

```json
{
  "uid": "123456...",
  "email": "student@yati.com",
  "displayName": "Jane Doe",
  "role": "student",           // Security: Default is ALWAYS 'student'
  "overallProgress": 1,        // Requirement: Initialize at 1%
  "createdAt": "2026-01-27T...",
  "lastLogin": "2026-01-27T...",
  "deviceInfo": { ... }
}
```

---

## 3. Initialization Logic (First Login)

We must handle two entry points: **Sign Up** (Manual) and **Social Login** (Google).

### A. Email/Password Sign Up
*Logic to be implemented in `signup` function:*

```javascript
/* implementation plan */
const result = await createUserWithEmailAndPassword(auth, email, password);

await setDoc(doc(db, 'users', result.user.uid), {
    uid: result.user.uid,
    email: email,
    displayName: name,
    role: 'student',
    overallProgress: 1, // ✅ Requirement: Start with 1%
    createdAt: new Date().toISOString()
});
```

### B. Google OAuth Login
*Logic to be implemented in `loginWithGoogle` function:*

```javascript
/* implementation plan */
const result = await signInWithPopup(auth, googleProvider);
const docRef = doc(db, 'users', result.user.uid);
const snap = await getDoc(docRef);

if (!snap.exists()) {
    // 🎉 First time user! Initialize profile.
    await setDoc(docRef, {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: 'student',
        overallProgress: 1, // ✅ Requirement: Start with 1%
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    });
} else {
    // 🔙 Returning user: Just update login stats
    await updateDoc(docRef, {
        lastLogin: new Date().toISOString()
    });
}
```

---

## 4. Role-Based Access Control (RBAC)

We secure the app on two levels:

### Level 1: Client-Side (Routing)
Using the `userRole` state in context:
*   **Public**: `/login`, `/`, `/courses`
*   **Student**: `/dashboard`, `/learning/*`
*   **Admin**: `/admin`, `/editor` -> **Requires `userRole === 'admin'`**

### Level 2: Server-Side (Firestore Rules)
Rules must strictly respect the role field:
```javascript
// Example Rule
allow write: if request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
```

---

## Summary of Changes Required
To implement this design, I will need to update `src/context/AuthContext.js`:
1.  Update `signup` to include `overallProgress: 1`.
2.  Update `loginWithGoogle` to include `overallProgress: 1`.
