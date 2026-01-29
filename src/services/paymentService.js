
import { addDoc, collection, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
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
