import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Receipt, Zap, Droplets, Wifi, Phone, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth.store'
import { getUserAccounts } from '@/services/account.service'
import { payBill } from '@/services/transaction.service'
import { formatCurrency } from '@/utils/format'
import type { Account } from '@/types'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const providers = [
  { id: 'yemen-electricity', name: 'كهرباء اليمن', type: 'electricity' as const, icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'yemen-water', name: 'مياه Yemen', type: 'water' as const, icon: Droplets, color: 'bg-blue-100 text-blue-600' },
  { id: 'yemen-net', name: 'يمن نت', type: 'internet' as const, icon: Wifi, color: 'bg-green-100 text-green-600' },
  { id: 'yemen-mobile', name: 'يمن موبايل', type: 'phone' as const, icon: Phone, color: 'bg-purple-100 text-purple-600' },
  { id: 'sabafon', name: 'سبأفون', type: 'phone' as const, icon: Phone, color: 'bg-orange-100 text-orange-600' },
  { id: 'mtn', name: 'MTN', type: 'phone' as const, icon: Phone, color: 'bg-yellow-100 text-yellow-600' },
]

const billSchema = z.object({
  accountId: z.string().min(1, 'اختر الحساب'),
  providerId: z.string().min(1, 'اختر مزود الخدمة'),
  accountNumber: z.string().min(5, 'رقم الحساب غير صالح'),
  amount: z.number().min(100, 'الحد الأدنى 100 ﷼').max(500000, 'الحد الأقصى 500,000 ﷼'),
})

type BillForm = z.infer<typeof billSchema>

export function BillsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BillForm>({
    resolver: zodResolver(billSchema),
  })

  const watchAmount = watch('amount')
  const watchAccountId = watch('accountId')
  const selectedAccount = accounts.find((a) => a.id === watchAccountId)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const result = await getUserAccounts(user.uid)
      if (result.success && result.data) {
        setAccounts(result.data)
        if (result.data.length > 0) {
          setValue('accountId', result.data[0].id)
        }
      }
      setLoading(false)
    }
    load()
  }, [user, setValue])

  const onSubmit = async (data: BillForm) => {
    if (selectedAccount && data.amount > selectedAccount.balance) {
      toast.error('الرصيد غير كافٍ')
      return
    }

    const result = await payBill({
      accountId: data.accountId,
      providerId: data.providerId,
      accountNumber: data.accountNumber,
      amount: data.amount,
    })

    if (result.success) {
      toast.success(result.message!)
      navigate('/history')
    } else {
      toast.error(result.error!)
    }
  }

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId)
    setValue('providerId', providerId)
  }

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
        <h1 className="text-2xl font-bold text-gray-900">دفع الفواتير</h1>
        <p className="text-gray-500 mt-1">ادفع فواتيرك بسهولة وأمان</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Providers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600" />
              مزود الخدمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleProviderSelect(provider.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedProvider === provider.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${provider.color} flex items-center justify-center`}>
                    <provider.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{provider.name}</span>
                </button>
              ))}
            </div>
            {errors.providerId && (
              <p className="text-sm text-danger-600 mt-2">{errors.providerId.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الفاتورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              {...register('accountId')}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.type === 'wallet' ? 'محفظة' : acc.type === 'savings' ? 'توفير' : 'جاري'} - {formatCurrency(acc.balance, acc.currency)}
                </option>
              ))}
            </select>

            <Input
              label="رقم الحساب / رقم العداد"
              placeholder="أدخل رقم الحساب"
              error={errors.accountNumber?.message}
              {...register('accountNumber')}
              dir="ltr"
              textAlign="right"
            />

            <Input
              label="المبلغ (﷼)"
              type="number"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
              dir="ltr"
              textAlign="right"
            />

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2">
              {[1000, 2000, 5000, 10000, 20000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setValue('amount', amount)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium"
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
                  <span className="text-gray-500">الرسوم</span>
                  <span className="font-medium text-success-600">مجاني</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold">الإجمالي</span>
                  <span className="font-bold text-primary-600">{formatCurrency(watchAmount)}</span>
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
          disabled={!watchAmount || !selectedProvider || (selectedAccount ? watchAmount > selectedAccount.balance : false)}
        >
          <Receipt className="w-5 h-5 ml-2" />
          دفع الفاتورة
        </Button>
      </form>
    </div>
  )
}
