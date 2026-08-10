import { useState, useEffect } from 'react'
import { Search, Filter, MoreVertical, UserCheck, UserX, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRequireAdmin } from '@/hooks'
import { getUsers, updateUserStatus, setUserRole } from '@/services/admin.service'
import { formatDate } from '@/utils/format'
import type { UserProfile, UserRole } from '@/types'
import toast from 'react-hot-toast'

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  customer: { label: 'عميل', color: 'bg-gray-100 text-gray-700' },
  agent: { label: 'وكيل', color: 'bg-blue-100 text-blue-700' },
  admin: { label: 'مدير', color: 'bg-accent-100 text-accent-700' },
  super_admin: { label: 'مدير عام', color: 'bg-primary-100 text-primary-700' },
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-success-100 text-success-700' },
  suspended: { label: 'معلق', color: 'bg-danger-100 text-danger-700' },
  pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700' },
}

export function AdminUsersPage() {
  const { loading: authLoading } = useRequireAdmin()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [roleFilter])

  const loadUsers = async () => {
    setLoading(true)
    const result = await getUsers(50, undefined, roleFilter || undefined)
    if (result.success && result.data) {
      setUsers(result.data.users)
    }
    setLoading(false)
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    const result = await updateUserStatus(userId, newStatus as 'active' | 'suspended')
    if (result.success) {
      toast.success(result.message!)
      loadUsers()
    } else {
      toast.error(result.error!)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const result = await setUserRole(userId, newRole)
    if (result.success) {
      toast.success(result.message!)
      loadUsers()
    } else {
      toast.error(result.error!)
    }
    setActiveMenu(null)
  }

  const filteredUsers = users.filter((u) => {
    if (search) {
      const s = search.toLowerCase()
      return (
        u.displayName.toLowerCase().includes(s) ||
        u.phone.includes(s) ||
        (u.email && u.email.toLowerCase().includes(s))
      )
    }
    return true
  })

  if (authLoading) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
        <p className="text-gray-500 mt-1">{users.length} مستخدم</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="بحث بالاسم أو رقم الهاتف..."
            icon={<Search className="w-5 h-5" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['', 'customer', 'agent', 'admin', 'super_admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {role === '' ? 'الكل' : roleLabels[role as UserRole]?.label || role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">رقم الهاتف</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">الصلاحية</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">KYC</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const role = roleLabels[u.role]
                  const status = statusLabels[u.status]

                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {u.displayName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.displayName}</p>
                            <p className="text-sm text-gray-500">{u.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">{u.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${role.color}`}>{role.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        {u.kyc.verified ? (
                          <span className="text-success-600"><UserCheck className="w-4 h-4" /></span>
                        ) : (
                          <span className="text-gray-400"><UserX className="w-4 h-4" /></span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>

                          {activeMenu === u.id && (
                            <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleToggleStatus(u.id, u.status)}
                                  className="w-full text-right px-4 py-2 text-sm hover:bg-gray-50"
                                >
                                  {u.status === 'active' ? 'تعليق الحساب' : 'تفعيل الحساب'}
                                </button>
                                <button
                                  onClick={() => handleRoleChange(u.id, 'admin')}
                                  className="w-full text-right px-4 py-2 text-sm hover:bg-gray-50"
                                >
                                  تعيين كمدير
                                </button>
                                <button
                                  onClick={() => handleRoleChange(u.id, 'customer')}
                                  className="w-full text-right px-4 py-2 text-sm hover:bg-gray-50"
                                >
                                  تعيين كعميل
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
