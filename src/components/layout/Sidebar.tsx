import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Receipt,
  Clock,
  User,
  Settings,
  Users,
  BarChart3,
  LogOut,
  X,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/auth.store'
import { useAppStore } from '@/store/app.store'
import { logout } from '@/services/auth.service'
import toast from 'react-hot-toast'

const customerLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/accounts', icon: Wallet, label: 'الحسابات' },
  { to: '/transfer', icon: ArrowLeftRight, label: 'تحويل أموال' },
  { to: '/bills', icon: Receipt, label: 'دفع الفواتير' },
  { to: '/history', icon: Clock, label: 'سجل المعاملات' },
  { to: '/profile', icon: User, label: 'الملف الشخصي' },
  { to: '/settings', icon: Settings, label: 'الإعدادات' },
]

const adminLinks = [
  { to: '/admin', icon: BarChart3, label: 'لوحة الإدارة' },
  { to: '/admin/users', icon: Users, label: 'إدارة المستخدمين' },
  { to: '/admin/transactions', icon: ArrowLeftRight, label: 'المعاملات' },
]

export function Sidebar() {
  const { profile, isAdmin } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const navigate = useNavigate()

  const links = [...customerLinks, ...(isAdmin() ? adminLinks : [])]

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      toast.success(result.message!)
      navigate('/login')
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full bg-white border-l border-gray-200 z-50 transition-transform duration-300 w-64',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">بنك رقمي</h2>
              <p className="text-xs text-gray-500">خدمات مصرفية</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {profile?.displayName || 'مستخدم'}
              </p>
              <p className="text-xs text-gray-500 truncate">{profile?.phone}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
              onClick={() => {
                if (window.innerWidth < 1024) {
                  toggleSidebar()
                }
              }}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* Collapse button (desktop) */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -left-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 items-center justify-center hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
      </aside>
    </>
  )
}
