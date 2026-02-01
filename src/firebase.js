// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBq2hwZQDp-WGVlxL176K4GBwaftoTqs4M",
    authDomain: "learning-platform-e12be.firebaseapp.com",
    projectId: "learning-platform-e12be",
    storageBucket: "learning-platform-e12be.firebasestorage.app",
    messagingSenderId: "759606649035",
    appId: "1:759606649035:web:e1fc961231a0fd15c3bb4e",
    measurementId: "G-ZY2KWQHNJE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
try {
    analytics = getAnalytics(app);
} catch (e) {
    console.warn("Firebase Analytics disabled:", e.message);
}
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { analytics, app, auth, db, googleProvider };

