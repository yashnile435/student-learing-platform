
import { addDoc, collection, doc, updateDoc, arrayUnion, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Creates a pending purchase record in Firestore.
 * @param {string} userId - The ID of the user making the purchase
 * @param {string} courseId - The ID of the course being purchased
 * @param {number} amount - The price amount
 * @returns {Promise<string>} - Returns the purchase ID
 */
export const initiatePurchase = async (userId, courseId, amount) => {
    try {
        const purchaseData = {
            userId,
            courseId,
            amount: parseFloat(amount),
            currency: 'USD',
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            paymentMethod: null, // To be filled by gateway logic
            gatewayTransactionId: null
        };

        const docRef = await addDoc(collection(db, 'purchases'), purchaseData);
        return docRef.id;
    } catch (error) {
        console.error("Error initiating purchase:", error);
        throw error;
    }
};

/**
 * Simulates the completion of a purchase (Mock Server-Side Logic).
 * In a real app, this would happen via a Webhook/Cloud Function after payment gateway confirmation.
 * @param {string} purchaseId - The ID of the purchase document
 * @param {string} userId - The user ID to unlock content for
 * @param {string} courseId - The course ID to unlock
 */
export const completePurchaseMock = async (purchaseId, userId, courseId) => {
    try {
        // 1. Update Purchase Status
        const purchaseRef = doc(db, 'purchases', purchaseId);
        await updateDoc(purchaseRef, {
            status: 'completed',
            updatedAt: serverTimestamp(),
            paymentMethod: 'mock_gateway'
        });

        // 2. Unlock Content (Safe Unlock Logic)
        // Access-check logic relies on the 'purchasedCourses' array in the user document
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            purchasedCourses: arrayUnion(courseId)
        });

        return true;
    } catch (error) {
        console.error("Error completing purchase:", error);
        throw error;
    }
};

/**
 * Marks a purchase as failed.
 * @param {string} purchaseId 
 */
export const failPurchase = async (purchaseId) => {
    try {
        const purchaseRef = doc(db, 'purchases', purchaseId);
        await updateDoc(purchaseRef, {
            status: 'failed',
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error failing purchase:", error);
    }
};

/**
 * Enrolls a user in a free course directly.
 * @param {string} userId
 * @param {string} courseId
 */
export const enrollFreeCourse = async (userId, courseId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            purchasedCourses: arrayUnion(courseId)
        });
        return true;
    } catch (error) {
        console.error("Error enrolling in free course:", error);
        throw error;
    }
};

/**
 * Submits a manual payment request after QR code payment.
 * @param {object} paymentData - { userId, courseId, courseName, userName, amount }
 */
export const submitManualPayment = async (paymentData) => {
    try {
        const data = {
            ...paymentData,
            status: 'pending',
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp(), // detailed timestamp
            type: 'manual_qr'
        };
        const docRef = await addDoc(collection(db, 'paymentRequests'), data);
        return docRef.id;
    } catch (error) {
        console.error("Error submitting manual payment:", error);
        throw error;
    }
};

/**
 * Fetches all pending manual payment requests.
 */
export const getPendingPayments = async () => {
    try {
        const q = query(
            collection(db, 'paymentRequests'),
            where('status', '==', 'pending'),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching pending payments:", error);
        throw error;
    }
};

/**
 * Approves a manual payment request.
 * @param {string} requestId 
 * @param {string} userId 
 * @param {string} courseId 
 */
export const approveManualPayment = async (requestId, userId, courseId) => {
    try {
        // 1. Update request status
        const requestRef = doc(db, 'paymentRequests', requestId);
        await updateDoc(requestRef, {
            status: 'approved',
            approvedAt: serverTimestamp()
        });

        // 2. Grant access to course
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            purchasedCourses: arrayUnion(courseId)
        });

        return true;
    } catch (error) {
        console.error("Error approving payment:", error);
        throw error;
    }
};
