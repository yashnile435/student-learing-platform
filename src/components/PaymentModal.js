
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import '../styles/PaymentModal.css';

const PaymentModal = ({ onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handlePurchase = async (plan) => {
        setLoading(true);
        try {
            // Simulate Payment Process
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Update User Plan in Firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                plan: plan
            });

            alert(`Successfully upgraded to ${plan.toUpperCase()} plan!`);
            window.location.reload(); // Simple reload to refresh state
            onClose();
        } catch (error) {
            console.error("Payment failed", error);
            alert("Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal-content" onClick={e => e.stopPropagation()}>
                <h2>Choose Your Plan</h2>
                <div className="plans-container">
                    <div className="plan-option">
                        <h3>Basic Plan</h3>
                        <p className="price">₹1999</p>
                        <ul>
                            <li><FaCheck /> 3 Starter Videos</li>
                            <li><FaCheck /> Community Access</li>
                        </ul>
                        <button
                            className="btn btn-secondary full-width"
                            onClick={() => handlePurchase('basic')}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Buy Basic'}
                        </button>
                    </div>
                    <div className="plan-option popular">
                        <div className="badge-pop">Best Value</div>
                        <h3>Premium Plan</h3>
                        <p className="price">₹4999</p>
                        <ul>
                            <li><FaCheck /> All Videos</li>
                            <li><FaCheck /> Downloadable Notes</li>
                            <li><FaCheck /> Priority Support</li>
                        </ul>
                        <button
                            className="btn btn-cta full-width"
                            onClick={() => handlePurchase('premium')}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Buy Premium'}
                        </button>
                    </div>
                </div>
                <button className="close-text-btn" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default PaymentModal;
