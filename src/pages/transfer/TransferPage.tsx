import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeftRight, Send, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth.store'
import { getUserAccounts } from '@/services/account.service'
import { transferMoney } from '@/services/transaction.service'
import { formatCurrency } from '@/utils/format'
import type { Account } from '@/types'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'اختر حساب المرسل'),
  toAccountNumber: z.string().min(9, 'رقم حساب المستلم غير صالح'),
  amount: z.number().min(1, 'المبلغ يجب أن يكون أكبر من صفر').max(1000000, 'المبلغ تجاوز الحد الأقصى'),
  description: z.string().optional(),
})

type TransferForm = z.infer<typeof transferSchema>

export function TransferPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
  })

  const watchFromAccountId = watch('fromAccountId')
  const watchAmount = watch('amount')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const result = await getUserAccounts(user.uid)
      if (result.success && result.data) {
        setAccounts(result.data)
        if (result.data.length > 0) {
          setValue('fromAccountId', result.data[0].id)
          setSelectedAccount(result.data[0])
        }
      }
      setLoading(false)
    }
    load()
  }, [user, setValue])

  useEffect(() => {
    const account = accounts.find((a) => a.id === watchFromAccountId)
    setSelectedAccount(account || null)
  }, [watchFromAccountId, accounts])

  const onSubmit = async (data: TransferForm) => {
    if (selectedAccount && data.amount > selectedAccount.balance) {
      toast.error('الرصيد غير كافٍ')
      return
    }

    const result = await transferMoney(data)
    if (result.success) {
      toast.success(result.message!)
      navigate('/history')
    } else {
      toast.error(result.error!)
    }
  }

  const fee = watchAmount ? Math.max(watchAmount * 0.005, 50) : 0
  const total = (watchAmount || 0) + fee

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تحويل أموال</h1>
        <p className="text-gray-500 mt-1">أرسل الأموال بسرعة وأمان</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* From Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary-600" />
              من حساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              {...register('fromAccountId')}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.type === 'wallet' ? 'محفظة' : acc.type === 'savings' ? 'توفير' : 'جاري'} - {formatCurrency(acc.balance, acc.currency)} - {acc.accountNumber}
                </option>
              ))}
            </select>
            {errors.fromAccountId && (
              <p className="text-sm text-danger-600 mt-1">{errors.fromAccountId.message}</p>
            )}
          </CardContent>
        </Card>

        {/* To Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary-600" />
              إلى حساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="رقم حساب المستلم"
              placeholder="967XXXXXXXX"
              error={errors.toAccountNumber?.message}
              {...register('toAccountNumber')}
              dir="ltr"
              textAlign="right"
            />
          </CardContent>
        </Card>

        {/* Amount */}
        <Card>
          <CardHeader>
            <CardTitle>المبلغ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="المبلغ (﷼)"
              type="number"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
              dir="ltr"
              textAlign="center"
              className="text-2xl font-bold text-center"
            />

            <Input
              label="الوصف (اختياري)"
              placeholder="مثال: دفع إيجار"
              {...register('description')}
            />

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2">
              {[10000, 25000, 50000, 100000, 250000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setValue('amount', amount)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {watchAmount > 0 && (
          <Card variant="bordered">
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">المبلغ</span>
                  <span className="font-medium">{formatCurrency(watchAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الرسوم (0.5%)</span>
                  <span className="font-medium">{formatCurrency(fee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold">الإجمالي</span>
                  <span className="font-bold text-primary-600">{formatCurrency(total)}</span>
                </div>
              </div>

              {selectedAccount && watchAmount > selectedAccount.balance && (
                <div className="mt-3 flex items-center gap-2 text-danger-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>الرصيد غير كافٍ</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          disabled={!watchAmount || (selectedAccount ? watchAmount > selectedAccount.balance : false)}
        >
          <Send className="w-5 h-5 ml-2" />
          تأكيد التحويل
        </Button>
      </form>
    </div>
  )
}
