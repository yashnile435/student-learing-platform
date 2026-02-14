const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * HTTPS Callable Function: submitPayment
 * Goal: Store payment record.
 * Called from frontend when student clicks 'Submit Payment'.
 */
exports.submitPayment = functions.https.onCall(async (data, context) => {
    try {
        const { studentName, studentEmail, courseName, amount } = data;

        // 1. Validation
        if (!studentName || !studentEmail || !courseName || !amount) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Missing required fields: studentName, studentEmail, courseName, or amount."
            );
        }

        // 2. Prepare Data
        const paymentData = {
            studentName,
            studentEmail,
            courseName,
            amount,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // 3. Save to Firestore
        const docRef = await admin.firestore().collection("payments").add(paymentData);
        const paymentId = docRef.id;
        console.log(`Payment record created: ${paymentId}`);

        // 4. Return Success
        return {
            success: true,
            paymentId: paymentId,
            message: "Payment submitted successfully.",
        };
    } catch (error) {
        console.error("Error in submitPayment:", error);
        // Re-throw generic error to client if it's not already an HttpsError
        if (!(error instanceof functions.https.HttpsError)) {
            throw new functions.https.HttpsError("internal", error.message);
        }
        throw error;
    }
});

// Removed sendPaymentConfirmation function as it was solely for email notifications.
