import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, Lock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { login } from '@/services/auth.service'
import { useRedirectIfAuth } from '@/hooks'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  phone: z.string().min(9, 'رقم الهاتف غير صالح').max(15, 'رقم الهاتف غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { loading: redirectLoading } = useRedirectIfAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    const result = await login(data)
    if (result.success) {
      toast.success(result.message!)
      navigate('/dashboard')
    } else {
      toast.error(result.error!)
    }
  }

  if (redirectLoading) return null

  return (
    <Card variant="elevated" padding="lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h2>
        <p className="text-gray-500 mt-2">أدخل بياناتك للوصول إلى حسابك</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="رقم الهاتف"
          type="tel"
          placeholder="77XXXXXXX"
          icon={<Phone className="w-5 h-5" />}
          error={errors.phone?.message}
          {...register('phone')}
          dir="ltr"
          textAlign="right"
        />

        <Input
          label="كلمة المرور"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-600">تذكرني</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting} size="lg">
          تسجيل الدخول
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        ليس لديك حساب؟{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">
          إنشاء حساب جديد
        </Link>
      </p>
    </Card>
  )
}
