import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

// Layouts
import { AppLayout, AuthLayout } from '@/components/layout'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'

// App pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { TransferPage } from '@/pages/transfer/TransferPage'
import { BillsPage } from '@/pages/bills/BillsPage'
import { HistoryPage } from '@/pages/history/HistoryPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { SettingsPage } from '@/pages/settings/SettingsPage'

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'

// Other
import { NotFoundPage } from '@/pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  const init = useAuthStore((state) => state.init)

  useEffect(() => {
    const unsubscribe = init()
    return () => unsubscribe()
  }, [init])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/accounts" element={<DashboardPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'IBM Plex Sans Arabic, Tajawal, sans-serif',
              direction: 'rtl',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
