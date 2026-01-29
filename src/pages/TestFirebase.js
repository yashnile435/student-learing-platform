
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';

const TestFirebase = () => {
    const [steps, setSteps] = useState([
        { name: 'Initialize Firebase', status: 'pending', details: '' },
        { name: 'Authentication (Anonymous)', status: 'pending', details: '' },
        { name: 'Firestore Write', status: 'pending', details: '' },
        { name: 'Firestore Read', status: 'pending', details: '' },
    ]);
    const [finalStatus, setFinalStatus] = useState('Testing...');
    const [seeding, setSeeding] = useState(false);
    const [seedStatus, setSeedStatus] = useState('');

    const updateStep = (index, status, details = '') => {
        setSteps(prev => {
            const newSteps = [...prev];
            newSteps[index] = { ...newSteps[index], status, details };
            return newSteps;
        });
    };

    const runTests = async () => {
        // Step 1: Init (Implicitly done by import)
        updateStep(0, 'success', 'Firebase App Initialized');

        try {
            // Step 2: Auth
            updateStep(1, 'running');
            let user;
            try {
                // Try anonymous auth to test connection
                const userCred = await signInAnonymously(auth);
                user = userCred.user;
                updateStep(1, 'success', `Authenticated as ${user.uid}`);
            } catch (authError) {
                updateStep(1, 'warning', `Auth failed: ${authError.message}. Check if Anonymous Auth is enabled in Firebase Console.`);
            }

            // Step 3: Firestore Write
            updateStep(2, 'running');
            const testDocRef = doc(db, 'test_connectivity', 'test_doc');
            const testData = {
                timestamp: new Date().toISOString(),
                status: 'connected',
                message: 'If you can read this, Firestore write is working.'
            };

            try {
                await setDoc(testDocRef, testData);
                updateStep(2, 'success', 'Wrote document to "test_connectivity/test_doc"');
            } catch (writeError) {
                throw new Error(`Firestore Write Failed: ${writeError.message}. Check Firestore Rules.`);
            }

            // Step 4: Firestore Read
            updateStep(3, 'running');
            try {
                const docSnap = await getDoc(testDocRef);
                if (docSnap.exists()) {
                    updateStep(3, 'success', `Read back data: ${JSON.stringify(docSnap.data())}`);
                } else {
                    throw new Error("Document was written but cannot be found.");
                }
            } catch (readError) {
                throw new Error(`Firestore Read Failed: ${readError.message}`);
            }

            setFinalStatus('SUCCESS: Firebase is fully linked and operational!');

        } catch (error) {
            console.error("Firebase Test Failed", error);
            setFinalStatus(`FAILED: ${error.message}`);
            // Mark current running step as failed
            setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', details: error.message } : s));
        }
    };

    useEffect(() => {
        runTests();
    }, []);

    const seedCourses = async () => {
        setSeeding(true);
        setSeedStatus('Starting seed process...');
        try {
            const videosRef = collection(db, 'videos');
            
            // Check if videos already exist to avoid duplicates (safeguard)
            const snapshot = await getDocs(videosRef);
            if (!snapshot.empty) {
                if(!window.confirm("Videos collection already has data. Add anyway?")) {
                    setSeeding(false);
                    setSeedStatus('Cancelled.');
                    return;
                }
            }

            const demoCourses = [
                {
                    title: "Python for Beginners - Full Course",
                    description: "Learn Python programming from scratch. This course covers basics, data structures, and loops.",
                    videoId: "_uQrJ0TkZlc", // Mosh
                    duration: 360,
                    isFree: true,
                    category: "Programming",
                    notesUrl: "https://example.com/python-notes1"
                },
                {
                    title: "JavaScript Crash Course for Beginners",
                    description: "A complete crash course on JavaScript for 2024. Closures, DOM, and more.",
                    videoId: "hdI2bqOjy3c", // Traversy
                    duration: 90,
                    isFree: true,
                    category: "Programming",
                    notesUrl: "https://example.com/js-notes"
                },
                {
                    title: "React JS - Full Course for Beginners",
                    description: "Master React.js by building real-world projects. Hooks, Router, and State Management.",
                    videoId: "SqcY0GlETPk", // Mosh
                    duration: 120,
                    isFree: false, // Premium
                    category: "Web Development",
                    notesUrl: "https://example.com/react-notes"
                },
                {
                    title: "Data Structures and Algorithms in Python",
                    description: "Ace your coding interview with this DSA course. Arrays, Linked Lists, Trees, and Graphs.",
                    videoId: "pkYVOmU3MgA", 
                    duration: 480,
                    isFree: false,
                    category: "Computer Science",
                    notesUrl: "https://example.com/dsa-notes"
                },
                {
                    title: "Introduction to Machine Learning",
                    description: "Understanding ML concepts: Supervised vs Unsupervised learning, Regression, and Neural Networks.",
                    videoId: "Gv9_4yMHFhI",
                    duration: 240,
                    isFree: false,
                    category: "Data Science",
                    notesUrl: "https://example.com/ml-notes"
                }
            ];

            let addedCount = 0;
            for (const course of demoCourses) {
                await addDoc(videosRef, course);
                addedCount++;
            }

            setSeedStatus(`Successfully added ${addedCount} demo courses!`);

        } catch (error) {
            console.error("Error seeding courses:", error);
            setSeedStatus(`Error: ${error.message}`);
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
            <h1>Firebase System Check & Setup</h1>
            
            {/* Seed Data Section */}
            <div style={{ marginBottom: '40px', padding: '20px', border: '2px dashed #007bff', borderRadius: '8px', background: '#f0f9ff' }}>
                <h2>🛠️ Admin Tools</h2>
                <p>Use this to populate your Firestore with demo data.</p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                        onClick={seedCourses} 
                        disabled={seeding}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: seeding ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: seeding ? 'not-allowed' : 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        {seeding ? 'Seeding...' : 'Create Demo Programming Courses'}
                    </button>
                    <span>{seedStatus}</span>
                </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: finalStatus.startsWith('SUCCESS') ? '#d4edda' : '#f8d7da', color: finalStatus.startsWith('SUCCESS') ? '#155724' : '#721c24', borderRadius: '4px' }}>
                <strong>{finalStatus}</strong>
            </div>

            <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                {steps.map((step, index) => (
                    <div key={index} style={{
                        padding: '15px',
                        borderBottom: '1px solid #eee',
                        backgroundColor: step.status === 'error' ? '#fff3f3' : (step.status === 'success' ? '#f6fffa' : 'white')
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                display: 'inline-block',
                                marginRight: '10px',
                                backgroundColor: step.status === 'success' ? 'green' : (step.status === 'error' ? 'red' : (step.status === 'warning' ? 'orange' : '#ccc'))
                            }}></span>
                            <span style={{ fontWeight: 'bold' }}>{step.name}</span>
                        </div>
                        {step.details && <div style={{ marginLeft: '30px', color: '#666', fontSize: '0.9em' }}>{step.details}</div>}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Instructions to Fix Common Issues:</h3>
                <ul>
                    <li><strong>Auth/Invalid-credential:</strong> The user does not exist or password is wrong.</li>
                    <li><strong>Auth/Operation-not-allowed:</strong> Enable authentication providers (Email/Password, Anonymous) in Firebase Console.</li>
                    <li><strong>Firestore/Permission-denied:</strong> Update Firestore Rules to allow read/write (e.g., `allow read, write: if true;` for testing only).</li>
                    <li><strong>Failed to fetch/Network Error:</strong> Check your internet connection or Firebase config parameters (API Key, Project ID).</li>
                </ul>
            </div>
        </div>
    );
};

export default TestFirebase;
