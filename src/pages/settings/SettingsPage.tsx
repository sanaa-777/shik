import { Globe, Bell, Shield, Moon, Smartphone, HelpCircle, FileText, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { useAppStore } from '@/store/app.store'
import { logout } from '@/services/auth.service'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const { profile } = useAuthStore()
  const { theme, toggleTheme } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      toast.success(result.message!)
      navigate('/login')
    }
  }

  const settingsGroups = [
    {
      title: 'عام',
      items: [
        {
          icon: Globe,
          label: 'اللغة',
          value: profile?.settings.language === 'ar' ? 'العربية' : 'English',
          action: () => {},
        },
        {
          icon: Moon,
          label: 'الوضع الداكن',
          value: theme === 'dark' ? 'مفعّل' : 'معطّل',
          action: toggleTheme,
        },
        {
          icon: Bell,
          label: 'الإشعارات',
          value: profile?.settings.notifications ? 'مفعّلة' : 'معطّلة',
          action: () => {},
        },
      ],
    },
    {
      title: 'الأمان',
      items: [
        {
          icon: Shield,
          label: 'كلمة المرور',
          value: 'تغيير',
          action: () => navigate('/change-password'),
        },
        {
          icon: Smartphone,
          label: 'المصادقة الثنائية',
          value: 'تفعيل',
          action: () => {},
        },
      ],
    },
    {
      title: 'أخرى',
      items: [
        {
          icon: FileText,
          label: 'الشروط والأحكام',
          value: '',
          action: () => navigate('/terms'),
        },
        {
          icon: HelpCircle,
          label: 'المساعدة والدعم',
          value: '',
          action: () => navigate('/support'),
        },
      ],
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500 mt-1">تخصيص إعدادات حسابك</p>
      </div>

      {settingsGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent padding="none">
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.value}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="danger" fullWidth size="lg" onClick={handleLogout}>
        <LogOut className="w-5 h-5 ml-2" />
        تسجيل الخروج
      </Button>
    </div>
  )
}
