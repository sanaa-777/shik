import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Phone, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { resetPassword } from '@/services/auth.service'
import toast from 'react-hot-toast'
import { useState } from 'react'

const schema = z.object({
  phone: z.string().min(9, 'رقم الهاتف غير صالح').max(15, 'رقم الهاتف غير صالح'),
})

type Form = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    const result = await resetPassword(data.phone)
    if (result.success) {
      toast.success(result.message!)
      setSent(true)
    } else {
      toast.error(result.error!)
    }
  }

  if (sent) {
    return (
      <Card variant="elevated" padding="lg" className="text-center">
        <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">تم إرسال الرابط</h2>
        <p className="text-gray-500 mb-6">
          تم إرسال رابط إعادة تعيين كلمة المرور إلى رقم هاتفك
        </p>
        <Link to="/login">
          <Button fullWidth>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة لتسجيل الدخول
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <Card variant="elevated" padding="lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">نسيت كلمة المرور؟</h2>
        <p className="text-gray-500 mt-2">أدخل رقم هاتفك وسنرسل لك رابط إعادة التعيين</p>
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

        <Button type="submit" fullWidth loading={isSubmitting} size="lg">
          إرسال رابط إعادة التعيين
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700 flex items-center justify-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة لتسجيل الدخول
        </Link>
      </p>
    </Card>
  )
}
