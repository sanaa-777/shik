import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { updatePassword } from 'firebase/auth'
import toast from 'react-hot-toast'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth.store'

const schema = z.object({
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function ChangePasswordPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return
    try {
      await updatePassword(user, data.password)
      toast.success('تم تغيير كلمة المرور بنجاح')
      navigate('/profile')
    } catch (error: unknown) {
      const code = (error as { code?: string }).code
      toast.error(code === 'auth/requires-recent-login'
        ? 'لأسباب أمنية، سجّل الدخول مجددًا ثم أعد المحاولة'
        : 'تعذر تغيير كلمة المرور، حاول مرة أخرى')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowRight className="w-5 h-5 ml-1" />
        العودة
      </Button>
      <Card>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
              <LockKeyhole className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">تغيير كلمة المرور</h1>
            <p className="text-gray-500 mt-2">استخدم كلمة مرور قوية لا تستخدمها في حساب آخر</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="كلمة المرور الجديدة"
              type="password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="تأكيد كلمة المرور"
              type="password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" fullWidth loading={isSubmitting} size="lg">
              حفظ كلمة المرور
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
