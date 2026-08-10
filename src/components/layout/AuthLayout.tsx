import { Outlet } from 'react-router-dom'
import { Wallet } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 flex-col items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">بنك رقمي</h1>
          <p className="text-xl text-primary-100 mb-8">
            خدمات مصرفية آمنة وسريعة في متناول يدك
          </p>
          <div className="space-y-4 text-right">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 rounded-full bg-primary-200" />
              <span>تحويلات فورية وآمنة</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 rounded-full bg-primary-200" />
              <span>دفع الفواتير بسهولة</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 rounded-full bg-primary-200" />
              <span>إدارة حساباتك المالية</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 rounded-full bg-primary-200" />
              <span>حماية متقدمة لبياناتك</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">بنك رقمي</h1>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
