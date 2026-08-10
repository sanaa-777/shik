import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Notification, ApiResponse } from '@/types'

const PAGE_SIZE = 50

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  pageSize: number = PAGE_SIZE
): Promise<ApiResponse<Notification[]>> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    )

    const snapshot = await getDocs(q)
    const notifications: Notification[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        read: data.read,
        data: data.data,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })

    return { success: true, data: notifications }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء جلب الإشعارات' }
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<ApiResponse<void>> {
  try {
    const docRef = doc(db, 'notifications', notificationId)
    await updateDoc(docRef, { read: true })
    return { success: true }
  } catch {
    return { success: false, error: 'حدث خطأ' }
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<ApiResponse<void>> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    )

    const snapshot = await getDocs(q)
    const updates = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    )

    await Promise.all(updates)
    return { success: true }
  } catch {
    return { success: false, error: 'حدث خطأ' }
  }
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  )

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        read: data.read,
        data: data.data,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })
    callback(notifications)
  })
}

/**
 * Get unread notification count
 */
export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  )

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size)
  })
}
