
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { auth, db } from '../firebase';

const SetupAdmin = () => {
    const [status, setStatus] = useState('Idle');
    const [error, setError] = useState(null);

    const createAdmin = async () => {
        setStatus('Creating...');
        setError(null);
        try {
            const email = 'admin@yati.com';
            const password = 'SecureAdminPassword123';

            let userCredential;
            try {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (e) {
                if (e.code === 'auth/email-already-in-use') {
                    // If user exists, we might need to sign in to update their role, 
                    // but strictly speaking we can't easily get the UID without signing in.
                    // For simplicity, let's assume we are creating a fresh one or fail if exists.
                    // Helper logic: login instead?
                    // But we don't know the password if it already exists.
                    // Let's assume it doesn't exist for now, or handle the error gracefully.
                    throw new Error("User already exists. Please delete 'admin@yati.com' from Firebase Authentication console first.");
                }
                throw e;
            }

            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: email,
                name: 'Admin User',
                role: 'admin',
                createdAt: new Date().toISOString()
            });

            setStatus('Success: Admin Created');
        } catch (err) {
            console.error(err);
            setError(err.message);
            setStatus('Failed');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Setup Admin</h1>
            <button onClick={createAdmin} disabled={status === 'Creating...'}>
                Create Admin User
            </button>
            <p>Status: {status}</p>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        </div>
    );
};

export default SetupAdmin;
