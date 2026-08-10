import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Account, ApiResponse } from '@/types'

/**
 * Get all accounts for a user
 */
export async function getUserAccounts(userId: string): Promise<ApiResponse<Account[]>> {
  try {
    const q = query(
      collection(db, 'accounts'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    const accounts: Account[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        userId: data.userId,
        type: data.type,
        currency: data.currency,
        balance: data.balance,
        status: data.status,
        accountNumber: data.accountNumber,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })

    return { success: true, data: accounts }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء جلب الحسابات' }
  }
}

/**
 * Get single account
 */
export async function getAccount(accountId: string): Promise<ApiResponse<Account>> {
  try {
    const docRef = doc(db, 'accounts', accountId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return { success: false, error: 'الحساب غير موجود' }
    }

    const data = docSnap.data()
    const account: Account = {
      id: docSnap.id,
      userId: data.userId,
      type: data.type,
      currency: data.currency,
      balance: data.balance,
      status: data.status,
      accountNumber: data.accountNumber,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }

    return { success: true, data: account }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء جلب الحساب' }
  }
}

/**
 * Subscribe to real-time account balance updates
 */
export function subscribeToAccount(
  accountId: string,
  callback: (account: Account) => void
): Unsubscribe {
  const docRef = doc(db, 'accounts', accountId)

  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data()
      callback({
        id: snapshot.id,
        userId: data.userId,
        type: data.type,
        currency: data.currency,
        balance: data.balance,
        status: data.status,
        accountNumber: data.accountNumber,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      })
    }
  })
}

/**
 * Get total balance across all accounts
 */
export async function getTotalBalance(userId: string): Promise<ApiResponse<number>> {
  const result = await getUserAccounts(userId)
  if (!result.success || !result.data) {
    return { success: false, error: result.error }
  }

  const total = result.data.reduce((sum, acc) => sum + acc.balance, 0)
  return { success: true, data: total }
}
