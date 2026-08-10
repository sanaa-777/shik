import { format, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import type { Currency } from '@/types'

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, currency: Currency = 'YER'): string {
  const symbols: Record<Currency, string> = {
    YER: '﷼',
    USD: '$',
    SAR: 'ر.س',
  }

  const formatted = new Intl.NumberFormat('ar-YE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${formatted} ${symbols[currency]}`
}

/**
 * Format date in Arabic
 */
export function formatDate(date: Date | string, pattern: string = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, pattern, { locale: ar })
}

/**
 * Format relative time in Arabic
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ar })
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  if (phone.startsWith('+967')) {
    const num = phone.slice(4)
    return `+967 ${num.slice(0, 3)} ${num.slice(3)}`
  }
  return phone
}

/**
 * Format account number (masked)
 */
export function formatAccountNumber(accountNumber: string, masked: boolean = false): string {
  if (masked) {
    return `****${accountNumber.slice(-4)}`
  }
  return accountNumber.replace(/(\d{4})/g, '$1 ').trim()
}

/**
 * Generate reference number
 */
export function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TXN-${timestamp}-${random}`
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Validate phone number (Yemen)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '')
  return /^(\+967|967|0)?[1-9]\d{7,8}$/.test(cleaned)
}

/**
 * Validate amount
 */
export function isValidAmount(amount: number, max: number = 1000000): boolean {
  return amount > 0 && amount <= max && Number.isFinite(amount)
}
