import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Phone, Lock, Mail } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { register as registerUser } from '@/services/auth.service'
import { useRedirectIfAuth } from '@/hooks'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  displayName: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  phone: z.string().min(9, 'رقم الهاتف غير صالح').max(15, 'رقم الهاتف غير صالح'),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { loading: redirectLoading } = useRedirectIfAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    const result = await registerUser(data)
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
        <h2 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h2>
        <p className="text-gray-500 mt-2">أنشئ حسابك وابدأ باستخدام الخدمات المصرفية</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="الاسم الكامل"
          placeholder="محمد أحمد"
          icon={<User className="w-5 h-5" />}
          error={errors.displayName?.message}
          {...register('displayName')}
        />

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
          label="البريد الإلكتروني (اختياري)"
          type="email"
          placeholder="example@email.com"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register('email')}
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

        <Input
          label="تأكيد كلمة المرور"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <label className="flex items-start gap-2">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5" />
          <span className="text-sm text-gray-600">
            أوافق على{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">الشروط والأحكام</Link>
            {' '}و{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">سياسة الخصوصية</Link>
          </span>
        </label>

        <Button type="submit" fullWidth loading={isSubmitting} size="lg">
          إنشاء الحساب
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        لديك حساب بالفعل؟{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
          تسجيل الدخول
        </Link>
      </p>
    </Card>
  )
}
