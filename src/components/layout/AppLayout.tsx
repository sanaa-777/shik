import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '@/store/app.store'
import { cn } from '@/utils/cn'
import { useRequireAuth } from '@/hooks'

export function AppLayout() {
  const { sidebarOpen } = useAppStore()
  const { loading, user } = useRequireAuth()

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">جارٍ التحقق من الجلسة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'lg:mr-64' : 'lg:mr-0'
        )}
      >
        <Header />

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
