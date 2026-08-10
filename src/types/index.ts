// User Types
export type UserRole = 'customer' | 'agent' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'suspended' | 'pending'
export type KYCLevel = 'none' | 'basic' | 'verified' | 'premium'

export interface UserProfile {
  id: string
  displayName: string
  phone: string
  email?: string
  avatar?: string
  nationalId?: string
  address?: string
  role: UserRole
  status: UserStatus
  kyc: {
    verified: boolean
    level: KYCLevel
    documents: string[]
  }
  settings: {
    language: 'ar' | 'en'
    notifications: boolean
    biometric: boolean
  }
  createdAt: Date
  updatedAt: Date
}

// Account Types
export type AccountType = 'wallet' | 'savings' | 'current'
export type AccountStatus = 'active' | 'frozen' | 'closed'
export type Currency = 'YER' | 'USD' | 'SAR'

export interface Account {
  id: string
  userId: string
  type: AccountType
  currency: Currency
  balance: number
  status: AccountStatus
  accountNumber: string
  createdAt: Date
  updatedAt: Date
}

// Transaction Types
export type TransactionType = 'transfer' | 'deposit' | 'withdrawal' | 'payment' | 'bill'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed'

export interface TransactionParty {
  accountId: string
  userId: string
  name: string
}

export interface Transaction {
  id: string
  from: TransactionParty
  to: TransactionParty
  amount: number
  currency: Currency
  type: TransactionType
  status: TransactionStatus
  fee: number
  reference: string
  description?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

// Bill Types
export type BillType = 'electricity' | 'water' | 'internet' | 'phone'
export type BillStatus = 'pending' | 'paid' | 'failed'

export interface BillProvider {
  id: string
  name: string
  type: BillType
  icon: string
}

export interface Bill {
  id: string
  userId: string
  type: BillType
  provider: string
  accountNumber: string
  amount: number
  status: BillStatus
  dueDate: Date
  paidAt?: Date
  createdAt: Date
}

// Notification Types
export type NotificationType = 'transaction' | 'account' | 'promotion' | 'security'

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  type: NotificationType
  read: boolean
  data?: Record<string, unknown>
  createdAt: Date
}

// Audit Log
export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string
  details?: Record<string, unknown>
  ip?: string
  timestamp: Date
}

// Form Types
export interface TransferFormData {
  fromAccountId: string
  toAccountNumber: string
  amount: number
  description?: string
}

export interface BillPaymentFormData {
  accountId: string
  providerId: string
  accountNumber: string
  amount: number
}

export interface LoginFormData {
  phone: string
  password: string
}

export interface RegisterFormData {
  displayName: string
  phone: string
  email?: string
  password: string
  confirmPassword: string
}

// API Response
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Dashboard Stats
export interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  transactionCount: number
  recentTransactions: Transaction[]
}
