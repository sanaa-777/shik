import { useEffect, useState } from 'react'
import {
  Wallet,
  ArrowUpLeft,
  ArrowDownRight,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { getUserAccounts } from '@/services/account.service'
import { subscribeToTransactions } from '@/services/transaction.service'
import { formatCurrency, formatRelativeTime } from '@/utils/format'
import type { Account, Transaction } from '@/types'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadAccounts = async () => {
      const result = await getUserAccounts(user.uid)
      if (result.success && result.data) {
        setAccounts(result.data)
      }
      setLoading(false)
    }

    loadAccounts()

    const unsubscribe = subscribeToTransactions(user.uid, (txns) => {
      setTransactions(txns)
    })

    return () => unsubscribe()
  }, [user])

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  const quickActions = [
    { icon: ArrowLeftRight, label: 'تحويل', action: () => navigate('/transfer'), color: 'bg-primary-100 text-primary-600' },
    { icon: Receipt, label: 'فاتورة', action: () => navigate('/bills'), color: 'bg-accent-100 text-accent-600' },
    { icon: ArrowDownRight, label: 'إيداع', action: () => navigate('/deposit'), color: 'bg-success-100 text-success-600' },
    { icon: ArrowUpLeft, label: 'سحب', action: () => navigate('/withdraw'), color: 'bg-danger-100 text-danger-600' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          مرحباً، {profile?.displayName?.split(' ')[0] || 'عزيزي'} 👋
        </h1>
        <p className="text-gray-500 mt-1">إليك ملخص حساباتك اليوم</p>
      </div>

      {/* Balance Card */}
      <Card variant="elevated" className="bg-gradient-to-l from-primary-600 to-primary-700 text-white">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-primary-100">الرصيد الكلي</span>
            <Wallet className="w-5 h-5 text-primary-200" />
          </div>
          <p className="text-3xl font-bold mb-2">{formatCurrency(totalBalance)}</p>
          <div className="flex items-center gap-2 text-primary-100 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+12.5% هذا الشهر</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">إجراءات سريعة</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">حساباتي</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
            عرض الكل
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} variant="bordered" className="hover:shadow-md transition-shadow">
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">
                    {account.type === 'wallet' ? 'محفظة' : account.type === 'savings' ? 'توفير' : 'جاري'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    account.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {account.status === 'active' ? 'نشط' : 'مجمد'}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {formatCurrency(account.balance, account.currency)}
                </p>
                <p className="text-xs text-gray-400 font-mono">{account.accountNumber}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">آخر المعاملات</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            عرض الكل
          </Button>
        </div>
        <Card>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد معاملات بعد</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((txn) => {
                  const isOutgoing = txn.from.userId === user?.uid
                  return (
                    <div key={txn.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isOutgoing ? 'bg-danger-100' : 'bg-success-100'
                        }`}>
                          {isOutgoing ? (
                            <ArrowUpLeft className="w-5 h-5 text-danger-600" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-success-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {isOutgoing ? `تحويل إلى ${txn.to.name}` : `استقبال من ${txn.from.name}`}
                          </p>
                          <p className="text-xs text-gray-400">{formatRelativeTime(txn.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${
                        isOutgoing ? 'text-danger-600' : 'text-success-600'
                      }`}>
                        {isOutgoing ? '-' : '+'}{formatCurrency(txn.amount, txn.currency)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
