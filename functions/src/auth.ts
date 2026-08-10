import * as admin from "firebase-admin";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { createLogger } from "./utils/logger";

const logger = createLogger("auth");

/**
 * Triggered when a new user is created via Firebase Auth.
 * Creates a user profile document and a default wallet account in Firestore.
 */
export const onUserCreate = beforeUserCreated(async (event) => {
  const uid = event.data?.uid;
  const email = event.data?.email ?? null;
  const displayName = event.data?.displayName ?? null;
  const phoneNumber = event.data?.phoneNumber ?? null;
  const photoURL = event.data?.photoURL ?? null;

  if (!uid) {
    logger.error("onUserCreate: Missing uid in event data");
    throw new Error("User creation failed: missing uid");
  }

  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  logger.info("Creating user profile and default wallet", { uid, email });

  try {
    // Use a transaction to ensure both documents are created atomically
    await db.runTransaction(async (tx) => {
      const userRef = db.collection("users").doc(uid);
      const accountRef = db.collection("accounts").doc();

      // Create user profile
      tx.set(userRef, {
        uid,
        email,
        displayName,
        phoneNumber,
        photoURL,
        role: "customer", // Default role
        status: "active",
        createdAt: now,
        updatedAt: now,
        kycStatus: "pending",
        preferences: {
          currency: "USD",
          language: "en",
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
      });

      // Create default wallet account
      tx.set(accountRef, {
        userId: uid,
        accountNumber: generateAccountNumber(),
        type: "wallet",
        currency: "USD",
        balance: 0,
        reservedBalance: 0,
        status: "active",
        nickname: "Main Wallet",
        createdAt: now,
        updatedAt: now,
      });

      logger.info("User profile and wallet created", {
        uid,
        accountId: accountRef.id,
      });
    });

    // Set default custom claims (role) on the Auth user
    await admin.auth().setCustomUserClaims(uid, { role: "customer" });

    logger.audit("USER_CREATED", uid, {
      email,
      defaultRole: "customer",
    });
  } catch (error) {
    logger.error("Failed to create user profile", {
      uid,
      error: (error as Error).message,
    });
    throw new Error("User profile creation failed");
  }
});

/**
 * Generate a random 16-digit account number.
 */
function generateAccountNumber(): string {
  let number = "";
  for (let i = 0; i < 16; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number;
}
