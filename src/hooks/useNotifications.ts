import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { subscribeToUnreadCount } from '@/services/notification.service'

/**
 * Hook to get unread notification count in real-time
 */
export function useUnreadNotifications(): number {
  const { user } = useAuthStore()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setCount(0)
      return
    }

    const unsubscribe = subscribeToUnreadCount(user.uid, setCount)
    return () => unsubscribe()
  }, [user])

  return count
}
