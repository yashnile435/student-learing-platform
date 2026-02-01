import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, updateProfile, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "../../firebase";

// Re-use config to create a secondary app instance
const firebaseConfig = {
    apiKey: "AIzaSyBq2hwZQDp-WGVlxL176K4GBwaftoTqs4M",
    authDomain: "learning-platform-e12be.firebaseapp.com",
    projectId: "learning-platform-e12be",
    storageBucket: "learning-platform-e12be.firebasestorage.app",
    messagingSenderId: "759606649035",
    appId: "1:759606649035:web:e1fc961231a0fd15c3bb4e",
    measurementId: "G-ZY2KWQHNJE"
};

const CreateTeacher = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        let secondaryApp = null;

        try {
            // 1. Initialize a secondary app instance to separate Auth context
            // This prevents the current Admin from being logged out
            secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);

            // 2. Create the Teacher User
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUser = userCredential.user;

            // 3. Update Profile
            await updateProfile(newUser, {
                displayName: name
            });

            // 4. Create Firestore Document (using the MAIN app's db instance)
            // We write to 'users' collection with role: 'teacher'
            await setDoc(doc(db, 'users', newUser.uid), {
                uid: newUser.uid,
                name: name,
                email: email,
                role: 'teacher',
                createdAt: new Date().toISOString(),
                createdByAdmin: true
            });

            // 5. Sign out the secondary, just to be clean
            await signOut(secondaryAuth);

            setSuccess(`Teacher "${name}" created successfully!`);
            setEmail('');
            setPassword('');
            setName('');

        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already in use.');
            } else {
                setError('Failed to create teacher account. ' + err.message);
            }
        } finally {
            // Cleanup the secondary app if possible (deleteApp is async, usually fine to verify garbage collection or just leave it)
            // Ideally: deleteApp(secondaryApp);
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="mb-4">Create Teacher Account</h1>

            <div className="card admin-card">
                <p className="mb-4" style={{ color: '#666' }}>
                    Create a new Instructor account. They will be able to log in, manage their assigned courses, and add lessons.
                    They cannot create new courses themselves.
                </p>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleCreateTeacher}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            className="form-input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="teacher@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Temporary Password</label>
                        <input
                            type="text" // Visible text for admin to copy
                            className="form-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="Enter a strong password"
                            minLength={6}
                        />
                        <small style={{ color: '#666' }}>Share this credentials securely with the instructor.</small>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Teacher'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateTeacher;
