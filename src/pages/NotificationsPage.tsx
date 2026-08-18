import { useEffect, useState } from 'react'
import { Bell, CheckCheck, ArrowRight, ShieldAlert, Wallet, Megaphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import {
  markAllAsRead,
  markAsRead,
  subscribeToNotifications,
} from '@/services/notification.service'
import type { Notification, NotificationType } from '@/types'
import toast from 'react-hot-toast'

const icons: Record<NotificationType, typeof Bell> = {
  transaction: Wallet,
  account: Bell,
  promotion: Megaphone,
  security: ShieldAlert,
}

const relativeTime = (date: Date) => {
  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  return `منذ ${Math.floor(hours / 24)} يوم`
}

export function NotificationsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!user) return
    return subscribeToNotifications(user.uid, setNotifications)
  }, [user])

  const handleMarkAll = async () => {
    if (!user) return
    const result = await markAllAsRead(user.uid)
    if (result.success) toast.success('تم تعليم الإشعارات كمقروءة')
    else toast.error(result.error || 'تعذر تحديث الإشعارات')
  }

  const handleRead = async (notification: Notification) => {
    if (notification.read) return
    const result = await markAsRead(notification.id)
    if (!result.success) toast.error(result.error || 'تعذر تحديث الإشعار')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} aria-label="العودة">
            <ArrowRight className="w-5 h-5 ml-1" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
            <p className="text-gray-500 mt-1">آخر التحديثات والتنبيهات الخاصة بحسابك</p>
          </div>
        </div>
        {notifications.some((notification) => !notification.read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAll}>
            <CheckCheck className="w-4 h-4 ml-2" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      <Card>
        <CardContent padding="none">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              لا توجد إشعارات حاليًا
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const Icon = icons[notification.type] || Bell
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleRead(notification)}
                    className={`w-full text-right p-5 flex gap-4 hover:bg-gray-50 transition-colors ${notification.read ? 'bg-white' : 'bg-primary-50/40'}`}
                  >
                    <span className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <strong className="text-gray-900">{notification.title}</strong>
                        {!notification.read && <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />}
                      </span>
                      <span className="block mt-1 text-sm text-gray-600">{notification.body}</span>
                      <span className="block mt-2 text-xs text-gray-400">{relativeTime(notification.createdAt)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
