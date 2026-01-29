
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import '../styles/UserProfile.css';
import { FaUser, FaEnvelope, FaDesktop, FaCalendarAlt } from 'react-icons/fa';

const UserProfile = () => {
    const { user } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.uid) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserData();
    }, [user]);

    if (loading) return <div className="loading">Loading profile...</div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <FaUser />
                    </div>
                    <h1>{userData?.name || user?.displayName || 'User'}</h1>
                    <p className="profile-role">{userData?.role || 'Student'}</p>
                </div>

                <div className="profile-details">
                    <div className="detail-item">
                        <FaEnvelope className="detail-icon" />
                        <div className="detail-content">
                            <label>Email</label>
                            <p>{user?.email}</p>
                        </div>
                    </div>

                    <div className="detail-item">
                        <FaCalendarAlt className="detail-icon" />
                        <div className="detail-content">
                            <label>Joined</label>
                            <p>{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    {userData?.lastLoginDevice && (
                        <div className="detail-item device-info">
                            <FaDesktop className="detail-icon" />
                            <div className="detail-content">
                                <label>Last Login Device</label>
                                <div className="device-details">
                                    <span>{userData.lastLoginDevice.browser} on {userData.lastLoginDevice.os}</span>
                                    <span className="device-type">({userData.lastLoginDevice.deviceType})</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
