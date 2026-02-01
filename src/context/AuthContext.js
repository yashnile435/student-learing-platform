import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null); // 'student' or 'admin'
    const [userData, setUserData] = useState(null); // Full user profile from Firestore

    useEffect(() => {
        let unsubscribeUserDoc = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);

                // Subscribe to user document changes logic
                const userDocRef = doc(db, 'users', currentUser.uid);

                unsubscribeUserDoc = onSnapshot(userDocRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        setUserRole(data.role);
                        setUserData(data);
                    } else {
                        // User document might not exist yet during creation
                        setUserRole('student');
                        setUserData(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user data:", error);
                    setLoading(false);
                });

            } else {
                setUser(null);
                setUserRole(null);
                setUserData(null);
                if (unsubscribeUserDoc) unsubscribeUserDoc();
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserDoc) unsubscribeUserDoc();
        };
    }, []);

    const signup = async (email, password, name, mobile) => {
        // 1. Create User in Auth
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // 2. Update Auth Profile (Display Name)
        try {
            await updateProfile(result.user, {
                displayName: name
            });
        } catch (e) {
            console.error("Error updating auth profile:", e);
        }

        // 3. Create User Document in Firestore
        // We explicitly set role to 'student' (Normal User)
        await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            email: email,
            name: name,
            mobile: mobile,
            role: 'student',
            overallProgress: 1,
            purchasedCourses: [],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });

        return result;
    };

    const getDeviceInfo = () => {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';
        let deviceType = 'Desktop';

        // Detect Browser
        if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
        else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';
        else if (userAgent.indexOf('Opera') > -1) browser = 'Opera';

        // Detect OS
        if (userAgent.indexOf('Win') > -1) os = 'Windows';
        else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
        else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
        else if (userAgent.indexOf('Android') > -1) os = 'Android';
        else if (userAgent.indexOf('iOS') > -1) os = 'iOS';

        // Detect Device Type
        if (/Mobile|Android|iPhone/i.test(userAgent)) deviceType = 'Mobile';
        else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

        return { browser, os, deviceType, userAgent };
    };

    const login = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Save login data to Firestore
        const deviceInfo = getDeviceInfo();
        const userDocRef = doc(db, 'users', result.user.uid);

        try {
            await setDoc(userDocRef, {
                lastLogin: new Date().toISOString(),
                lastLoginDevice: deviceInfo,
                email: result.user.email
            }, { merge: true });
        } catch (error) {
            console.error('Error saving login data:', error);
        }

        return result;
    };

    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        const deviceInfo = getDeviceInfo();

        // Check if user exists, if not create
        const userDocRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
                uid: result.user.uid,
                email: result.user.email,
                name: result.user.displayName,
                role: 'student',
                overallProgress: 1, // Requirement: Start with 1%
                purchasedCourses: [],
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                lastLoginDevice: deviceInfo
            });
        } else {
            // Update last login info
            await setDoc(userDocRef, {
                lastLogin: new Date().toISOString(),
                lastLoginDevice: deviceInfo
            }, { merge: true });
        }
        return result;
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        user,
        userRole,
        userData,
        signup,
        login,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : <Loading />}
        </AuthContext.Provider>
    );
};
