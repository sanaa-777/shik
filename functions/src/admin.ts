import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { createLogger } from "./utils/logger";
import {
  requireAuth,
  requireRole,
  validateSetUserRoleInput,
  validateReverseTransactionInput,
} from "./utils/validators";

const logger = createLogger("admin");

/**
 * Set a user's role. Only callable by super_admin.
 * Updates both Firebase Auth custom claims and the Firestore user document.
 */
export const setUserRole = onCall(
  { region: "us-central1", enforceAppCheck: false },
  async (request) => {
    const callerUid = requireAuth(request);
    requireRole(request, ["super_admin"]);

    const input = validateSetUserRoleInput(request.data);
    const { targetUserId, role } = input;

    logger.audit("SET_USER_ROLE_ATTEMPT", callerUid, {
      targetUserId,
      newRole: role,
    });

    // Prevent super_admin from demoting themselves
    if (targetUserId === callerUid && role !== "super_admin") {
      throw new HttpsError(
        "failed-precondition",
        "Cannot change your own super_admin role."
      );
    }

    const db = admin.firestore();
    const auth = admin.auth();

    try {
      // Verify target user exists
      const userRecord = await auth.getUser(targetUserId);
      if (!userRecord) {
        throw new HttpsError("not-found", "Target user not found.");
      }

      // Update custom claims
      await auth.setCustomUserClaims(targetUserId, { role });

      // Update Firestore user document
      await db.collection("users").doc(targetUserId).update({
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.audit("SET_USER_ROLE_SUCCESS", callerUid, {
        targetUserId,
        newRole: role,
        previousRole: (userRecord.customClaims?.role as string) || "customer",
      });

      return {
        success: true,
        message: `Role updated to '${role}' for user ${targetUserId}.`,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      logger.error("Failed to set user role", {
        callerUid,
        targetUserId,
        role,
        error: (error as Error).message,
      });
      throw new HttpsError("internal", "Failed to update user role.");
    }
  }
);

/**
 * Reverse a transaction. Only callable by admin or super_admin.
 * Creates a reversal transaction and restores original account balances.
 */
export const reverseTransaction = onCall(
  { region: "us-central1", enforceAppCheck: false },
  async (request) => {
    const callerUid = requireAuth(request);
    requireRole(request, ["admin", "super_admin"]);

    const input = validateReverseTransactionInput(request.data);
    const { transactionId, reason } = input;

    logger.audit("REVERSE_TRANSACTION_ATTEMPT", callerUid, {
      transactionId,
      reason,
    });

    const db = admin.firestore();

    try {
      const result = await db.runTransaction(async (tx) => {
        const txRef = db.collection("transactions").doc(transactionId);
        const txDoc = await tx.get(txRef);

        if (!txDoc.exists) {
          throw new HttpsError("not-found", "Transaction not found.");
        }

        const txData = txDoc.data()!;

        // Only completed transactions can be reversed
        if (txData.status !== "completed") {
          throw new HttpsError(
            "failed-precondition",
            `Cannot reverse transaction with status '${txData.status}'. Only 'completed' transactions can be reversed.`
          );
        }

        // Prevent double reversal
        if (txData.reversed) {
          throw new HttpsError(
            "failed-precondition",
            "Transaction has already been reversed."
          );
        }

        const { fromAccountId, toAccountId, amount, currency, type } = txData;

        // For transfers: reverse the balance changes
        if (type === "transfer" && fromAccountId && toAccountId) {
          const fromRef = db.collection("accounts").doc(fromAccountId);
          const toRef = db.collection("accounts").doc(toAccountId);

          const [fromDoc, toDoc] = await Promise.all([
            tx.get(fromRef),
            tx.get(toRef),
          ]);

          if (!fromDoc.exists || !toDoc.exists) {
            throw new HttpsError(
              "failed-precondition",
              "One or both accounts no longer exist."
            );
          }

          // Reverse: add back to sender, deduct from receiver
          tx.update(fromRef, {
            balance: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          tx.update(toRef, {
            balance: admin.firestore.FieldValue.increment(-amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // For bill payments: refund the sender
        if (type === "bill_payment" && fromAccountId) {
          const fromRef = db.collection("accounts").doc(fromAccountId);
          const fromDoc = await tx.get(fromRef);

          if (!fromDoc.exists) {
            throw new HttpsError(
              "failed-precondition",
              "Source account no longer exists."
            );
          }

          tx.update(fromRef, {
            balance: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Mark original transaction as reversed
        tx.update(txRef, {
          reversed: true,
          reversedBy: callerUid,
          reversedAt: admin.firestore.FieldValue.serverTimestamp(),
          reversalReason: reason,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create a reversal transaction record
        const reversalRef = db.collection("transactions").doc();
        tx.set(reversalRef, {
          type: "reversal",
          originalTransactionId: transactionId,
          fromAccountId: toAccountId || null,
          toAccountId: fromAccountId || null,
          amount,
          currency,
          status: "completed",
          userId: txData.userId,
          description: `Reversal of transaction ${transactionId}: ${reason}`,
          reversedBy: callerUid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { reversalTransactionId: reversalRef.id };
      });

      logger.audit("REVERSE_TRANSACTION_SUCCESS", callerUid, {
        transactionId,
        reversalTransactionId: result.reversalTransactionId,
        reason,
      });

      return {
        success: true,
        message: "Transaction reversed successfully.",
        reversalTransactionId: result.reversalTransactionId,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      logger.error("Failed to reverse transaction", {
        callerUid,
        transactionId,
        error: (error as Error).message,
      });
      throw new HttpsError("internal", "Failed to reverse transaction.");
    }
  }
);
