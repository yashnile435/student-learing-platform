# Quick Firebase Console Checklist

Use this checklist to ensure Firebase is properly configured.

## ✅ Authentication Setup

Navigate to: **Firebase Console → Authentication → Sign-in method**

### Required Providers:

- [ ] **Email/Password** - Status: Enabled
- [ ] **Google** - Status: Enabled  
- [ ] **Anonymous** - Status: Enabled (for testing)

## ✅ Firestore Database Setup

Navigate to: **Firebase Console → Firestore Database**

### Database Status:
- [ ] Database created
- [ ] Location selected
- [ ] Mode: Test mode (for development)

### Security Rules:
- [ ] Rules updated (see FIREBASE_SETUP.md)
- [ ] Rules published

## ✅ Project Configuration

### Current Firebase Config:
```javascript
Project ID: learning-platform-e12be
Auth Domain: learning-platform-e12be.firebaseapp.com
```

### Authorized Domains:
Navigate to: **Authentication → Settings → Authorized domains**

- [ ] `localhost` is in the list
- [ ] Your production domain (if deploying)

## ✅ Testing Checklist

After configuration, verify:

1. [ ] Navigate to `http://localhost:3000/test`
2. [ ] All 4 tests pass:
   - [ ] Initialize Firebase ✅
   - [ ] Authentication (Anonymous) ✅
   - [ ] Firestore Write ✅
   - [ ] Firestore Read ✅
3. [ ] Final status shows: "SUCCESS: Firebase is fully linked and operational!"

## ✅ User Flow Testing

1. [ ] Signup works (`/signup`)
2. [ ] Login works (`/login`)
3. [ ] Google login works
4. [ ] Dashboard accessible after login (`/dashboard`)
5. [ ] Logout works
6. [ ] User data saved in Firestore

## 🔍 Verify Firestore Data

Navigate to: **Firestore Database → Data**

After a user logs in, you should see:

```
users (collection)
  └── {userId} (document)
      ├── uid: "..."
      ├── email: "user@example.com"
      ├── name: "User Name"
      ├── role: "student"
      ├── createdAt: "2026-01-27T..."
      ├── lastLogin: "2026-01-27T..."
      └── lastLoginDevice:
          ├── browser: "Chrome"
          ├── os: "Windows"
          ├── deviceType: "Desktop"
          └── userAgent: "Mozilla/5.0..."
```

## 🚨 Common Issues

### Issue: Tests fail at Authentication step
**Error**: `auth/admin-restricted-operation`
**Fix**: Enable Email/Password authentication in Firebase Console

### Issue: Tests fail at Firestore Write
**Error**: `firestore/permission-denied`
**Fix**: Update Firestore security rules and publish

### Issue: Google login doesn't work
**Error**: `auth/unauthorized-domain`
**Fix**: Add domain to authorized domains list

### Issue: Can't access after login
**Problem**: User document not created
**Fix**: Check Firestore rules allow user document creation

## 📊 Expected Console Output

When running `npm start`, you should see:
```
Compiled successfully!

You can now view yati in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

No Firebase errors should appear in the browser console.

## 🎯 Success Criteria

✅ All authentication methods enabled
✅ Firestore database created and configured
✅ Security rules published
✅ Test page shows all green checkmarks
✅ Users can signup/login
✅ User data appears in Firestore
✅ No console errors

---

**Need help?** See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.
