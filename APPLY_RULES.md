# 🔥 How to Apply Firestore Security Rules

## Quick Steps:

### Option 1: Copy & Paste in Firebase Console (Recommended)

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `learning-platform-e12be`
3. **Navigate to Firestore**:
   - Click "Firestore Database" in left sidebar
   - Click the "Rules" tab at the top
4. **Replace the rules**:
   - Delete all existing rules
   - Copy the content from `firestore.rules` file
   - Paste into the editor
5. **Publish**:
   - Click the blue "Publish" button
   - Wait for confirmation message

### Option 2: Deploy via Firebase CLI

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## 📋 What These Rules Do:

### ✅ Test Collection
```javascript
match /test_connectivity/{document=**} {
  allow read, write: if true;
}
```
- Allows the `/test` page to verify Firebase connection
- **Remove this in production!**

### ✅ Users Collection
```javascript
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow create, update: if request.auth.uid == userId;
}
```
- Users can only read/write their own data
- Prevents users from accessing other users' information
- Admins can read all users

### ✅ Courses Collection
```javascript
match /courses/{courseId} {
  allow read: if request.auth != null;
  allow write: if [admin check];
}
```
- All authenticated users can view courses
- Only admins can create/edit/delete courses

### ✅ Enrollments Collection
```javascript
match /enrollments/{enrollmentId} {
  allow read, create: if request.auth != null;
}
```
- Authenticated users can read and create enrollments
- Admins have full access

## 🧪 Test After Applying Rules:

1. Navigate to: `http://localhost:3000/test`
2. All tests should pass:
   - ✅ Initialize Firebase
   - ✅ Authentication (Anonymous)
   - ✅ Firestore Write
   - ✅ Firestore Read
3. Status: "SUCCESS: Firebase is fully linked and operational!"

## ⚠️ Important Notes:

### For Development:
- Keep the `test_connectivity` rule enabled
- This allows the test page to work

### For Production:
- **Remove** the `test_connectivity` rule
- Consider adding rate limiting
- Add data validation
- Enable Firebase App Check

## 🔍 Verify Rules Are Active:

1. Go to Firebase Console → Firestore Database → Rules
2. You should see the new rules
3. Check the "Last updated" timestamp
4. Try the test page to confirm

## 🚨 Troubleshooting:

### Error: "Missing or insufficient permissions"
- **Cause**: Rules not published yet
- **Fix**: Click "Publish" in Firebase Console

### Error: "permission-denied" on test page
- **Cause**: Anonymous auth not enabled
- **Fix**: Enable Anonymous auth in Authentication settings

### Error: Users can't create accounts
- **Cause**: Rules too restrictive
- **Fix**: Verify the rules match the `firestore.rules` file exactly

## ✅ Success Checklist:

- [ ] Rules copied to Firebase Console
- [ ] "Publish" button clicked
- [ ] Confirmation message received
- [ ] Test page shows all green checkmarks
- [ ] Users can signup/login
- [ ] Data appears in Firestore

---

**Current Rules File**: `firestore.rules`
**Need Help?**: See `FIREBASE_SETUP.md` for complete setup guide
