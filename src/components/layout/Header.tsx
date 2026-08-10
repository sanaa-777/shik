import { Bell, Menu, Search } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useAppStore } from '@/store/app.store'
import { useUnreadNotifications } from '@/hooks/useNotifications'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { profile } = useAuthStore()
  const { toggleSidebar } = useAppStore()
  const unreadCount = useUnreadNotifications()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Right side (RTL) */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none flex-1"
            />
          </div>
        </div>

        {/* Left side (RTL) */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-gray-100"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {profile?.displayName?.charAt(0) || 'م'}
              </span>
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {profile?.displayName}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
