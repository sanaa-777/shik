import { useState, useEffect } from 'react'
import {
  ArrowUpLeft,
  ArrowDownRight,
  Receipt,
  Filter,
  Download,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth.store'
import { getTransactionHistory } from '@/services/transaction.service'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/format'
import type { Transaction, TransactionType } from '@/types'

const typeLabels: Record<TransactionType, string> = {
  transfer: 'تحويل',
  deposit: 'إيداع',
  withdrawal: 'سحب',
  payment: 'دفع',
  bill: 'فاتورة',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  completed: { label: 'مكتملة', color: 'bg-success-100 text-success-700' },
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
  failed: { label: 'فشلت', color: 'bg-danger-100 text-danger-700' },
  reversed: { label: 'معكوسة', color: 'bg-gray-100 text-gray-700' },
}

export function HistoryPage() {
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TransactionType | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const result = await getTransactionHistory(user.uid, 50)
      if (result.success && result.data) {
        setTransactions(result.data.transactions)
      }
      setLoading(false)
    }

    load()
  }, [user])

  const filteredTransactions = transactions.filter((txn) => {
    if (filter !== 'all' && txn.type !== filter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        txn.to.name.toLowerCase().includes(searchLower) ||
        txn.from.name.toLowerCase().includes(searchLower) ||
        txn.reference.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const filters: { value: TransactionType | 'all'; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'transfer', label: 'تحويلات' },
    { value: 'payment', label: 'مدفوعات' },
    { value: 'deposit', label: 'إيداعات' },
    { value: 'withdrawal', label: 'سحوبات' },
    { value: 'bill', label: 'فواتير' },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">سجل المعاملات</h1>
          <p className="text-gray-500 mt-1">{transactions.length} معاملة</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 ml-2" />
          تصدير
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="بحث بالاسم أو المرجع..."
            icon={<Search className="w-5 h-5" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <Card>
        <CardContent padding="none">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد معاملات</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((txn) => {
                const isOutgoing = txn.from.userId === user?.uid
                const status = statusLabels[txn.status]

                return (
                  <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
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
                        <p className="font-medium text-gray-900">
                          {isOutgoing ? `تحويل إلى ${txn.to.name}` : `استقبال من ${txn.from.name}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{formatDate(txn.createdAt)}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-400">{typeLabels[txn.type]}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-400 font-mono">{txn.reference}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold ${
                        isOutgoing ? 'text-danger-600' : 'text-success-600'
                      }`}>
                        {isOutgoing ? '-' : '+'}{formatCurrency(txn.amount, txn.currency)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
