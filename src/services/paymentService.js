
import { addDoc, collection, doc, updateDoc, arrayUnion, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

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
 * Uploads a payment screenshot to Firebase Storage.
 * @param {File} file 
 * @param {string} userId 
 */
export const uploadPaymentScreenshot = async (file, userId) => {
    try {
        const storageRef = ref(storage, `payment_screenshots/${userId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading screenshot:", error);
        throw error;
    }
};

/**
 * Submits a manual payment request after QR code payment.
 * @param {object} paymentData - { userId, courseId, courseName, userName, amount, transactionId }
 */
export const submitManualPayment = async (paymentData) => {
    try {
        // Validation: Check for duplicates in 'transactions'
        // Validation: Check for duplicates in 'transactions'
        // Simplified query to avoid missing index errors
        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', paymentData.userId),
            where('courseId', '==', paymentData.courseId)
        );
        const existingSnapshot = await getDocs(q);

        // Filter in memory to be safe against index requirements
        const duplicate = existingSnapshot.docs.find(doc => {
            const status = doc.data().status;
            return ['submitted', 'verified', 'processing'].includes(status);
        });

        if (duplicate) {
            throw new Error("You have already submitted a payment for this course. Please wait for verification.");
        }

        // Explicitly define fields for 'transactions' collection
        const data = {
            userId: paymentData.userId,
            userName: paymentData.userName,
            userEmail: paymentData.userEmail,
            courseId: paymentData.courseId,
            courseName: paymentData.courseName,
            amount: paymentData.amount,

            // Critical fields
            utrNumber: paymentData.utrNumber,
            paymentMethod: 'QR', // Requirement

            status: 'submitted',
            createdAt: serverTimestamp(),
            timestamp: serverTimestamp(), // Keeping for backward compat if needed, but createdAt is main
            verifiedAt: null,
            accessGrantedAt: null,
            type: 'manual_qr'
        };

        const docRef = await addDoc(collection(db, 'transactions'), data);
        return docRef.id;
    } catch (error) {
        console.error("Error submitting manual payment:", error);
        throw error;
    }
};

/**
 * Fetches all transaction records (Admin view).
 * Replaces getPendingPayments usage.
 */
export const getPendingPayments = async () => {
    try {
        const q = query(
            collection(db, 'transactions'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error;
    }
};

/**
 * 1. Verify Transaction (Does NOT grant access)
 * @param {string} transactionId 
 */
export const verifyManualPayment = async (transactionId) => {
    try {
        const docRef = doc(db, 'transactions', transactionId);
        await updateDoc(docRef, {
            status: 'verified',
            verifiedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error verifying transaction:", error);
        throw error;
    }
};

/**
 * 2. Grant Access (Final Step)
 * @param {string} transactionId 
 * @param {string} userId 
 * @param {string} courseId 
 */
export const grantAccessManualPayment = async (transactionId, userId, courseId) => {
    try {
        // 1. Update transaction status
        const docRef = doc(db, 'transactions', transactionId);
        await updateDoc(docRef, {
            status: 'access_granted',
            accessGrantedAt: serverTimestamp()
        });

        // 2. Grant access to course
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            purchasedCourses: arrayUnion(courseId)
        });

        return true;
    } catch (error) {
        console.error("Error granting access:", error);
        throw error;
    }
};

/**
 * Rejects a transaction.
 * @param {string} transactionId 
 */
export const rejectManualPayment = async (transactionId) => {
    try {
        const docRef = doc(db, 'transactions', transactionId);
        await updateDoc(docRef, {
            status: 'rejected',
            rejectedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error rejecting transaction:", error);
        throw error;
    }
};

/**
 * Fetches payment history for a specific user.
 * @param {string} userId 
 */
export const getUserPayments = async (userId) => {
    try {
        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Client-side sort to avoid index requirement
        return payments.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error("Error fetching user transactions:", error);
        throw error;
    }
};

/**
 * Fetches all payments for analytics (admin).
 */
export const getAllPayments = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'transactions'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching all transactions:", error);
        throw error;
    }
};
