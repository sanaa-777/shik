import { useState, useEffect } from 'react'
import { Users, ArrowLeftRight, TrendingUp, Activity, UserCheck, UserX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useRequireAdmin } from '@/hooks'
import { getDashboardStats } from '@/services/admin.service'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalVolume: number
}

export function AdminDashboard() {
  const { loading: authLoading } = useRequireAdmin()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const result = await getDashboardStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-primary-100 text-primary-600',
      change: '+12%',
    },
    {
      title: 'المستخدمين النشطين',
      value: stats?.activeUsers || 0,
      icon: UserCheck,
      color: 'bg-success-100 text-success-600',
      change: '+8%',
    },
    {
      title: 'إجمالي المعاملات',
      value: stats?.totalTransactions || 0,
      icon: ArrowLeftRight,
      color: 'bg-accent-100 text-accent-600',
      change: '+23%',
    },
    {
      title: 'حجم المعاملات',
      value: `${(stats?.totalVolume || 0).toLocaleString()} ﷼`,
      icon: TrendingUp,
      color: 'bg-yellow-100 text-yellow-600',
      change: '+15%',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على النظام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-success-600 font-medium">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>المعاملات اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <Activity className="w-8 h-8 mr-2" />
              <span>رسم بياني</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <Users className="w-8 h-8 mr-2" />
              <span>رسم بياني</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
