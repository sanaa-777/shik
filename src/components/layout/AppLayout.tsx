import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '@/store/app.store'
import { cn } from '@/utils/cn'

export function AppLayout() {
  const { sidebarOpen } = useAppStore()

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
