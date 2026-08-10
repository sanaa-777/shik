import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  type Unsubscribe,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/config/firebase'
import type { Transaction, TransferFormData, BillPaymentFormData, ApiResponse } from '@/types'

const PAGE_SIZE = 20

/**
 * Transfer money (calls Cloud Function)
 */
export async function transferMoney(data: TransferFormData): Promise<ApiResponse<Transaction>> {
  try {
    const transferFn = httpsCallable<TransferFormData, Transaction>(functions, 'transferMoney')
    const result = await transferFn(data)
    return { success: true, data: result.data, message: 'تم التحويل بنجاح' }
  } catch (error: unknown) {
    const message = (error as { message?: string }).message || 'حدث خطأ أثناء التحويل'
    return { success: false, error: message }
  }
}

/**
 * Pay bill (calls Cloud Function)
 */
export async function payBill(data: BillPaymentFormData): Promise<ApiResponse<Transaction>> {
  try {
    const payBillFn = httpsCallable<BillPaymentFormData, Transaction>(functions, 'processBillPayment')
    const result = await payBillFn(data)
    return { success: true, data: result.data, message: 'تم دفع الفاتورة بنجاح' }
  } catch (error: unknown) {
    const message = (error as { message?: string }).message || 'حدث خطأ أثناء الدفع'
    return { success: false, error: message }
  }
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  userId: string,
  pageSize: number = PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot
): Promise<ApiResponse<{ transactions: Transaction[]; lastDoc: QueryDocumentSnapshot | null }>> {
  try {
    let q = query(
      collection(db, 'transactions'),
      where('from.userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    )

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const snapshot = await getDocs(q)
    const transactions: Transaction[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        from: data.from,
        to: data.to,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        status: data.status,
        fee: data.fee,
        reference: data.reference,
        description: data.description,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null

    return {
      success: true,
      data: { transactions, lastDoc: lastVisible },
    }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء جلب المعاملات' }
  }
}

/**
 * Get single transaction
 */
export async function getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
  try {
    const docRef = doc(db, 'transactions', transactionId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return { success: false, error: 'المعاملة غير موجودة' }
    }

    const data = docSnap.data()
    const transaction: Transaction = {
      id: docSnap.id,
      from: data.from,
      to: data.to,
      amount: data.amount,
      currency: data.currency,
      type: data.type,
      status: data.status,
      fee: data.fee,
      reference: data.reference,
      description: data.description,
      metadata: data.metadata,
      createdAt: data.createdAt?.toDate() || new Date(),
    }

    return { success: true, data: transaction }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء جلب المعاملة' }
  }
}

/**
 * Subscribe to real-time transaction updates
 */
export function subscribeToTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void,
  pageSize: number = 10
): Unsubscribe {
  const q = query(
    collection(db, 'transactions'),
    where('from.userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  )

  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        from: data.from,
        to: data.to,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        status: data.status,
        fee: data.fee,
        reference: data.reference,
        description: data.description,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })
    callback(transactions)
  })
}
