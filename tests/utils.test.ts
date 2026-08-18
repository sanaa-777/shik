import { describe, expect, it } from 'vitest'
import { formatAccountNumber, formatPhone, isValidAmount, isValidPhone, truncate } from '@/utils/format'

describe('format utilities', () => {
  it('formats and masks account numbers safely', () => {
    expect(formatAccountNumber('123456789012')).toBe('1234 5678 9012')
    expect(formatAccountNumber('123456789012', true)).toBe('****9012')
  })

  it('formats Yemen phone numbers', () => {
    expect(formatPhone('+967771234567')).toBe('+967 771 234567')
    expect(isValidPhone('+967771234567')).toBe(true)
    expect(isValidPhone('invalid')).toBe(false)
  })

  it('validates finite positive amounts', () => {
    expect(isValidAmount(100)).toBe(true)
    expect(isValidAmount(0)).toBe(false)
    expect(isValidAmount(Number.NaN)).toBe(false)
    expect(isValidAmount(1001, 1000)).toBe(false)
  })

  it('truncates only when needed', () => {
    expect(truncate('short', 10)).toBe('short')
    expect(truncate('abcdefghij', 5)).toBe('abcde...')
  })
})
