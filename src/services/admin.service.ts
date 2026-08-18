import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/config/firebase'
import type { UserProfile, ApiResponse } from '@/types'

const PAGE_SIZE = 50

/**
 * Get all users (admin only)
 */
export async function getUsers(
  pageSize: number = PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot,
  roleFilter?: string,
  statusFilter?: string
): Promise<ApiResponse<{ users: UserProfile[]; lastDoc: QueryDocumentSnapshot | null }>> {
  try {
    let q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    )

    if (roleFilter) {
      q = query(q, where('role', '==', roleFilter))
    }
    if (statusFilter) {
      q = query(q, where('status', '==', statusFilter))
    }
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const snapshot = await getDocs(q)
    const users: UserProfile[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        displayName: data.displayName,
        phone: data.phone,
        email: data.email,
        avatar: data.avatar,
        nationalId: data.nationalId,
        address: data.address,
        role: data.role,
        status: data.status,
        kyc: data.kyc,
        settings: data.settings,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null

    return {
      success: true,
      data: { users, lastDoc: lastVisible },
    }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء جلب المستخدمين' }
  }
}

/**
 * Get single user (admin only)
 */
export async function getUser(userId: string): Promise<ApiResponse<UserProfile>> {
  try {
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return { success: false, error: 'المستخدم غير موجود' }
    }

    const data = docSnap.data()
    const user: UserProfile = {
      id: docSnap.id,
      displayName: data.displayName,
      phone: data.phone,
      email: data.email,
      avatar: data.avatar,
      nationalId: data.nationalId,
      address: data.address,
      role: data.role,
      status: data.status,
      kyc: data.kyc,
      settings: data.settings,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }

    return { success: true, data: user }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء جلب المستخدم' }
  }
}

/**
 * Update user status (admin only)
 */
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended'
): Promise<ApiResponse<void>> {
  try {
    const docRef = doc(db, 'users', userId)
    await updateDoc(docRef, { status, updatedAt: new Date() })
    return { success: true, message: `تم ${status === 'active' ? 'تفعيل' : 'تعليق'} الحساب` }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء تحديث الحالة' }
  }
}

/**
 * Set user role (super admin only - calls Cloud Function)
 */
export async function setUserRole(
  userId: string,
  role: string
): Promise<ApiResponse<void>> {
  try {
    const setRoleFn = httpsCallable<{ targetUserId: string; role: string }, void>(
      functions,
      'setUserRole'
    )
    await setRoleFn({ targetUserId: userId, role })
    return { success: true, message: 'تم تحديث الصلاحية بنجاح' }
  } catch (error: unknown) {
    const message = (error as { message?: string }).message || 'حدث خطأ'
    return { success: false, error: message }
  }
}

/**
 * Get dashboard stats (admin only)
 */
export async function getDashboardStats(): Promise<ApiResponse<{
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalVolume: number
}>> {
  try {
    const [usersSnap, activeSnap, txnSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'users'), where('status', '==', 'active'))),
      getDocs(collection(db, 'transactions')),
    ])

    return {
      success: true,
      data: {
        totalUsers: usersSnap.size,
        activeUsers: activeSnap.size,
        totalTransactions: txnSnap.size,
        totalVolume: 0, // Calculated from transactions
      },
    }
  } catch {
    return { success: false, error: 'حدث خطأ' }
  }
}
