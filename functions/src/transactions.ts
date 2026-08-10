import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { createLogger } from "./utils/logger";
import {
  requireAuth,
  validateTransferInput,
  validateBillPaymentInput,
} from "./utils/validators";

const logger = createLogger("transactions");

/**
 * Transfer money between two accounts.
 * Uses Firestore.runTransaction for atomic balance updates.
 * All amounts are in smallest currency unit (cents) to avoid floating point issues.
 */
export const transferMoney = onCall(
  { region: "us-central1", enforceAppCheck: false },
  async (request) => {
    const callerUid = requireAuth(request);
    const input = validateTransferInput(request.data);

    logger.audit("TRANSFER_INITIATED", callerUid, {
      fromAccountId: input.fromAccountId,
      toAccountNumber: input.toAccountNumber,
      amount: input.amount,
      currency: input.currency,
    });

    // Check for idempotency key to prevent duplicate transfers
    if (input.idempotencyKey) {
      const db = admin.firestore();
      const existingTx = await db
        .collection("transactions")
        .where("idempotencyKey", "==", input.idempotencyKey)
        .where("userId", "==", callerUid)
        .limit(1)
        .get();

      if (!existingTx.empty) {
        logger.info("Duplicate transfer blocked by idempotency key", {
          callerUid,
          idempotencyKey: input.idempotencyKey,
        });
        return {
          success: true,
          transactionId: existingTx.docs[0].id,
          message: "Transfer already processed.",
          duplicate: true,
        };
      }
    }

    const db = admin.firestore();

    // Look up destination account by account number
    const toAccountQuery = await db
      .collection("accounts")
      .where("accountNumber", "==", input.toAccountNumber)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (toAccountQuery.empty) {
      throw new HttpsError("not-found", "Destination account not found or inactive.");
    }

    const toAccountId = toAccountQuery.docs[0].id;

    try {
      const result = await db.runTransaction(async (tx) => {
        const fromRef = db.collection("accounts").doc(input.fromAccountId);
        const toRef = db.collection("accounts").doc(toAccountId);

        // Read both accounts within the transaction
        const [fromDoc, toDoc] = await Promise.all([
          tx.get(fromRef),
          tx.get(toRef),
        ]);

        // Validate source account
        if (!fromDoc.exists) {
          throw new HttpsError("not-found", "Source account not found.");
        }
        const fromAccount = fromDoc.data()!;

        // Validate destination account
        if (!toDoc.exists) {
          throw new HttpsError("not-found", "Destination account not found.");
        }
        const toAccount = toDoc.data()!;

        // Verify ownership of source account
        if (fromAccount.userId !== callerUid) {
          throw new HttpsError(
            "permission-denied",
            "You can only transfer from your own account."
          );
        }

        // Verify accounts are active
        if (fromAccount.status !== "active") {
          throw new HttpsError(
            "failed-precondition",
            "Source account is not active."
          );
        }
        if (toAccount.status !== "active") {
          throw new HttpsError(
            "failed-precondition",
            "Destination account is not active."
          );
        }

        // Verify currency match
        if (fromAccount.currency !== input.currency || toAccount.currency !== input.currency) {
          throw new HttpsError(
            "failed-precondition",
            "Currency mismatch. Both accounts must use the same currency."
          );
        }

        // Calculate available balance
        const availableBalance = fromAccount.balance - (fromAccount.reservedBalance || 0);

        // Verify sufficient balance
        if (availableBalance < input.amount) {
          throw new HttpsError(
            "failed-precondition",
            `Insufficient funds. Available: ${availableBalance}, Requested: ${input.amount}.`
          );
        }

        // Perform atomic balance updates
        tx.update(fromRef, {
          balance: admin.firestore.FieldValue.increment(-input.amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        tx.update(toRef, {
          balance: admin.firestore.FieldValue.increment(input.amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create transaction record
        const txRef = db.collection("transactions").doc();
        const transactionData = {
          type: "transfer",
          fromAccountId: input.fromAccountId,
          toAccountId: toAccountId,\n          amount: input.amount,
          currency: input.currency,
          status: "completed",
          userId: callerUid,
          description: input.description || `Transfer to ${input.toAccountNumber}`,
          idempotencyKey: input.idempotencyKey || null,
          fromBalanceBefore: fromAccount.balance,
          fromBalanceAfter: fromAccount.balance - input.amount,
          toBalanceBefore: toAccount.balance,
          toBalanceAfter: toAccount.balance + input.amount,
          reversed: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        tx.set(txRef, transactionData);

        return { transactionId: txRef.id };
      });

      logger.audit("TRANSFER_COMPLETED", callerUid, {
        transactionId: result.transactionId,
        fromAccountId: input.fromAccountId,
        toAccountId: toAccountId,
        amount: input.amount,
        currency: input.currency,
      });

      return {
        success: true,
        transactionId: result.transactionId,
        message: "Transfer completed successfully.",
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      logger.error("Transfer failed", {
        callerUid,
        fromAccountId: input.fromAccountId,
        toAccountNumber: input.toAccountNumber,
        amount: input.amount,
        error: (error as Error).message,
      });
      throw new HttpsError("internal", "Transfer failed. Please try again.");
    }
  }
);

/**
 * Process a bill payment from a user's account.
 * Deducts the amount and creates a transaction record.
 */
export const processBillPayment = onCall(
  { region: "us-central1", enforceAppCheck: false },
  async (request) => {
    const callerUid = requireAuth(request);
    const input = validateBillPaymentInput(request.data);

    logger.audit("BILL_PAYMENT_INITIATED", callerUid, {
      accountId: input.accountId,
      billerId: input.billerId,
      amount: input.amount,
      currency: input.currency,
    });

    const db = admin.firestore();

    try {
      const result = await db.runTransaction(async (tx) => {
        const accountRef = db.collection("accounts").doc(input.accountId);
        const accountDoc = await tx.get(accountRef);

        if (!accountDoc.exists) {
          throw new HttpsError("not-found", "Account not found.");
        }

        const account = accountDoc.data()!;

        // Verify ownership
        if (account.userId !== callerUid) {
          throw new HttpsError(
            "permission-denied",
            "You can only pay from your own account."
          );
        }

        // Verify account is active
        if (account.status !== "active") {
          throw new HttpsError(
            "failed-precondition",
            "Account is not active."
          );
        }

        // Verify currency
        if (account.currency !== input.currency) {
          throw new HttpsError(
            "failed-precondition",
            "Currency mismatch with account."
          );
        }

        // Verify sufficient balance
        const availableBalance = account.balance - (account.reservedBalance || 0);
        if (availableBalance < input.amount) {
          throw new HttpsError(
            "failed-precondition",
            `Insufficient funds. Available: ${availableBalance}, Required: ${input.amount}.`
          );
        }

        // Look up the biller
        const billerRef = db.collection("bills").doc(input.billerId);
        const billerDoc = await tx.get(billerRef);

        if (!billerDoc.exists) {
          throw new HttpsError("not-found", "Biller not found.");
        }

        // Deduct from account
        tx.update(accountRef, {
          balance: admin.firestore.FieldValue.increment(-input.amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create transaction record
        const txRef = db.collection("transactions").doc();
        tx.set(txRef, {
          type: "bill_payment",
          fromAccountId: input.accountId,
          toAccountId: null,
          billerId: input.billerId,
          amount: input.amount,
          currency: input.currency,
          status: "completed",
          userId: callerUid,
          description: `Bill payment to ${input.billerId}`,
          reference: input.reference || null,
          fromBalanceBefore: account.balance,
          fromBalanceAfter: account.balance - input.amount,
          reversed: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { transactionId: txRef.id };
      });

      logger.audit("BILL_PAYMENT_COMPLETED", callerUid, {
        transactionId: result.transactionId,
        accountId: input.accountId,
        billerId: input.billerId,
        amount: input.amount,
      });

      return {
        success: true,
        transactionId: result.transactionId,
        message: "Bill payment processed successfully.",
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      logger.error("Bill payment failed", {
        callerUid,
        accountId: input.accountId,
        billerId: input.billerId,
        error: (error as Error).message,
      });
      throw new HttpsError("internal", "Bill payment failed. Please try again.");
    }
  }
);

/**
 * Firestore trigger: fires when a new transaction document is created.
 * Handles post-transaction tasks like notifications.
 */
export const onTransactionCreate = onDocumentCreated(
  "transactions/{transactionId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn("onTransactionCreate: No data in event");
      return;
    }

    const transaction = snapshot.data();
    const transactionId = event.params.transactionId;

    logger.info("Transaction created, processing notification", {
      transactionId,
      type: transaction.type,
      status: transaction.status,
      userId: transaction.userId,
    });

    const db = admin.firestore();

    try {
      // Build notification content based on transaction type
      let notificationBody = "";
      const amountFormatted = formatAmount(transaction.amount, transaction.currency);

      switch (transaction.type) {
        case "transfer":
          notificationBody = `Transfer of ${amountFormatted} has been completed.`;
          break;
        case "bill_payment":
          notificationBody = `Bill payment of ${amountFormatted} has been processed.`;
          break;
        case "reversal":
          notificationBody = `Transaction reversal of ${amountFormatted} has been completed.`;
          break;
        default:
          notificationBody = `Transaction of ${amountFormatted} has been processed.`;
      }

      // Create notification for the user
      await db.collection("notifications").add({
        userId: transaction.userId,
        type: "transaction",
        title: "Transaction Completed",
        body: notificationBody,
        transactionId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Notification created for transaction", {
        transactionId,
        userId: transaction.userId,
      });

      // Write audit log
      await db.collection("auditLogs").add({
        action: "TRANSACTION_NOTIFICATION_SENT",
        transactionId,
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error("Failed to process transaction notification", {
        transactionId,
        error: (error as Error).message,
      });
      // Don't throw - notification failure shouldn't block the transaction
    }
  }
);

/**
 * Format amount from smallest unit to display string.
 * e.g., 1500 cents -> "$15.00"
 */
function formatAmount(amount: number, currency: string): string {
  const majorAmount = (amount / 100).toFixed(2);
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CNY: "¥",
    JPY: "¥",
  };
  const symbol = symbols[currency] || currency + " ";
  return `${symbol}${majorAmount}`;
}
