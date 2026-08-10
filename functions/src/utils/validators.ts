import { HttpsError } from "firebase-functions/v2/https";

/**
 * All monetary amounts are stored in the smallest currency unit
 * (e.g., cents for USD, pence for GBP) to avoid floating-point issues.
 * 100 smallest units = 1 main unit (e.g., 100 cents = $1.00).
 */

export interface TransferInput {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number; // smallest currency unit
  currency: string;
  description?: string;
  idempotencyKey?: string;
}

export interface BillPaymentInput {
  accountId: string;
  billerId: string;
  amount: number; // smallest currency unit
  currency: string;
  reference?: string;
}

export interface SetUserRoleInput {
  targetUserId: string;
  role: string;
}

export interface ReverseTransactionInput {
  transactionId: string;
  reason: string;
}

const VALID_ROLES = ["customer", "agent", "admin", "super_admin"] as const;
const VALID_CURRENCIES = ["USD", "EUR", "GBP", "CNY", "JPY"] as const;
const MAX_TRANSFER_AMOUNT = 1_000_000_00; // $1,000,000.00 in cents
const MIN_TRANSFER_AMOUNT = 1; // 1 cent minimum
const UUID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

function throwValidation(message: string): never {
  throw new HttpsError("invalid-argument", message);
}

function throwUnauthenticated(message: string): never {
  throw new HttpsError("unauthenticated", message);
}

function throwPermissionDenied(message: string): never {
  throw new HttpsError("permission-denied", message);
}

/**
 * Validate that the caller is authenticated and returns the UID.
 */
export function requireAuth(context: { auth?: { uid?: string; token?: Record<string, unknown> } }): string {
  if (!context.auth?.uid) {
    throwUnauthenticated("Authentication required.");
  }
  return context.auth!.uid;
}

/**
 * Validate the caller has one of the specified roles.
 */
export function requireRole(
  context: { auth?: { uid?: string; token?: Record<string, unknown> } },
  roles: readonly string[]
): void {
  const uid = requireAuth(context);
  const userRole = context.auth!.token?.role as string | undefined;

  if (!userRole || !roles.includes(userRole)) {
    throwPermissionDenied(
      `Insufficient permissions. Required role: ${roles.join(" or ")}.`
    );
  }
}

/**
 * Validate transfer input data.
 */
export function validateTransferInput(data: unknown): TransferInput {
  if (!data || typeof data !== "object") {
    throwValidation("Request body must be an object.");
  }

  const input = data as Record<string, unknown>;

  // fromAccountId
  if (!input.fromAccountId || typeof input.fromAccountId !== "string") {
    throwValidation("fromAccountId is required and must be a string.");
  }
  if (!UUID_REGEX.test(input.fromAccountId)) {
    throwValidation("fromAccountId contains invalid characters.");
  }

  // toAccountNumber
  if (!input.toAccountNumber || typeof input.toAccountNumber !== "string") {
    throwValidation("toAccountNumber is required and must be a string.");
  }
  if (!/^[0-9]{9,16}$/.test(input.toAccountNumber)) {
    throwValidation("toAccountNumber must be 9-16 digits.");
  }

  // Cannot transfer to same account number
  if (input.fromAccountId === input.toAccountNumber) {
    throwValidation("Cannot transfer to the same account.");
  }

  // amount
  if (input.amount === undefined || input.amount === null) {
    throwValidation("amount is required.");
  }
  if (typeof input.amount !== "number" || !Number.isInteger(input.amount)) {
    throwValidation("amount must be an integer (smallest currency unit).");
  }
  if (input.amount < MIN_TRANSFER_AMOUNT) {
    throwValidation(`amount must be at least ${MIN_TRANSFER_AMOUNT}.`);
  }
  if (input.amount > MAX_TRANSFER_AMOUNT) {
    throwValidation(`amount cannot exceed ${MAX_TRANSFER_AMOUNT}.`);
  }

  // currency
  if (!input.currency || typeof input.currency !== "string") {
    throwValidation("currency is required and must be a string.");
  }
  const currency = input.currency.toUpperCase();
  if (!CURRENCY_CODE_REGEX.test(currency)) {
    throwValidation("currency must be a valid 3-letter ISO code.");
  }
  if (!(VALID_CURRENCIES as readonly string[]).includes(currency)) {
    throwValidation(`currency '${currency}' is not supported.`);
  }

  // description (optional)
  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== "string") {
      throwValidation("description must be a string.");
    }
    if ((input.description as string).length > 500) {
      throwValidation("description cannot exceed 500 characters.");
    }
  }

  // idempotencyKey (optional)
  if (input.idempotencyKey !== undefined && input.idempotencyKey !== null) {
    if (typeof input.idempotencyKey !== "string") {
      throwValidation("idempotencyKey must be a string.");
    }
    if ((input.idempotencyKey as string).length > 256) {
      throwValidation("idempotencyKey cannot exceed 256 characters.");
    }
  }

  return {
    fromAccountId: input.fromAccountId as string,
    toAccountNumber: input.toAccountNumber as string,
    amount: input.amount as number,
    currency,
    description: input.description as string | undefined,
    idempotencyKey: input.idempotencyKey as string | undefined,
  };
}

/**
 * Validate bill payment input data.
 */
export function validateBillPaymentInput(data: unknown): BillPaymentInput {
  if (!data || typeof data !== "object") {
    throwValidation("Request body must be an object.");
  }

  const input = data as Record<string, unknown>;

  if (!input.accountId || typeof input.accountId !== "string") {
    throwValidation("accountId is required and must be a string.");
  }
  if (!UUID_REGEX.test(input.accountId as string)) {
    throwValidation("accountId contains invalid characters.");
  }

  if (!input.billerId || typeof input.billerId !== "string") {
    throwValidation("billerId is required and must be a string.");
  }
  if (!UUID_REGEX.test(input.billerId as string)) {
    throwValidation("billerId contains invalid characters.");
  }

  if (input.amount === undefined || input.amount === null) {
    throwValidation("amount is required.");
  }
  if (typeof input.amount !== "number" || !Number.isInteger(input.amount)) {
    throwValidation("amount must be an integer (smallest currency unit).");
  }
  if (input.amount < MIN_TRANSFER_AMOUNT || input.amount > MAX_TRANSFER_AMOUNT) {
    throwValidation(`amount must be between ${MIN_TRANSFER_AMOUNT} and ${MAX_TRANSFER_AMOUNT}.`);
  }

  if (!input.currency || typeof input.currency !== "string") {
    throwValidation("currency is required.");
  }
  const currency = (input.currency as string).toUpperCase();
  if (!(VALID_CURRENCIES as readonly string[]).includes(currency)) {
    throwValidation(`currency '${currency}' is not supported.`);
  }

  if (input.reference !== undefined && input.reference !== null) {
    if (typeof input.reference !== "string" || (input.reference as string).length > 256) {
      throwValidation("reference must be a string under 256 characters.");
    }
  }

  return {
    accountId: input.accountId as string,
    billerId: input.billerId as string,
    amount: input.amount as number,
    currency,
    reference: input.reference as string | undefined,
  };
}

/**
 * Validate set user role input data.
 */
export function validateSetUserRoleInput(data: unknown): SetUserRoleInput {
  if (!data || typeof data !== "object") {
    throwValidation("Request body must be an object.");
  }

  const input = data as Record<string, unknown>;

  if (!input.targetUserId || typeof input.targetUserId !== "string") {
    throwValidation("targetUserId is required and must be a string.");
  }

  if (!input.role || typeof input.role !== "string") {
    throwValidation("role is required and must be a string.");
  }
  if (!(VALID_ROLES as readonly string[]).includes(input.role as string)) {
    throwValidation(`role must be one of: ${VALID_ROLES.join(", ")}.`);
  }

  return {
    targetUserId: input.targetUserId as string,
    role: input.role as string,
  };
}

/**
 * Validate reverse transaction input data.
 */
export function validateReverseTransactionInput(data: unknown): ReverseTransactionInput {
  if (!data || typeof data !== "object") {
    throwValidation("Request body must be an object.");
  }

  const input = data as Record<string, unknown>;

  if (!input.transactionId || typeof input.transactionId !== "string") {
    throwValidation("transactionId is required and must be a string.");
  }
  if (!UUID_REGEX.test(input.transactionId as string)) {
    throwValidation("transactionId contains invalid characters.");
  }

  if (!input.reason || typeof input.reason !== "string") {
    throwValidation("reason is required and must be a string.");
  }
  if ((input.reason as string).length < 10) {
    throwValidation("reason must be at least 10 characters.");
  }
  if ((input.reason as string).length > 1000) {
    throwValidation("reason cannot exceed 1000 characters.");
  }

  return {
    transactionId: input.transactionId as string,
    reason: input.reason as string,
  };
}
