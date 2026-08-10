import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK once at module load
admin.initializeApp();

// Re-export all Cloud Functions
export { onUserCreate } from "./auth";
export { transferMoney, processBillPayment, onTransactionCreate } from "./transactions";
export { setUserRole, reverseTransaction } from "./admin";
