import { beforeEach, describe, expect, it, vi } from 'vitest'

const { callableMock } = vi.hoisted(() => ({
  callableMock: vi.fn(),
}))

vi.mock('firebase/functions', () => ({
  httpsCallable: callableMock,
}))

vi.mock('@/config/firebase', () => ({
  functions: {},
  db: {},
}))

import { payBill, transferMoney } from '@/services/transaction.service'
import { setUserRole } from '@/services/admin.service'

describe('frontend to Cloud Functions integration contracts', () => {
  beforeEach(() => {
    callableMock.mockReset()
  })

  it('calls transferMoney with the exact backend payload and maps success', async () => {
    const transfer = vi.fn().mockResolvedValue({
      data: { success: true, transactionId: 'tx-1' },
    })
    callableMock.mockReturnValueOnce(transfer)

    const payload = {
      fromAccountId: 'account-1',
      toAccountNumber: '222222222',
      amount: 1000,
      currency: 'YER',
      description: 'اختبار التحويل',
      idempotencyKey: 'test-transfer-1',
    }

    const result = await transferMoney(payload)

    expect(callableMock).toHaveBeenCalledWith({}, 'transferMoney')
    expect(transfer).toHaveBeenCalledWith(payload)
    expect(result).toEqual({
      success: true,
      data: { success: true, transactionId: 'tx-1' },
      message: 'تم التحويل بنجاح',
    })
  })

  it('maps callable transfer errors without throwing into the UI layer', async () => {
    const transfer = vi.fn().mockRejectedValue(new Error('Authentication required.'))
    callableMock.mockReturnValueOnce(transfer)

    const result = await transferMoney({
      fromAccountId: 'account-1',
      toAccountNumber: '222222222',
      amount: 1000,
      currency: 'YER',
    })

    expect(result).toEqual({ success: false, error: 'Authentication required.' })
  })

  it('calls processBillPayment with the bill contract and maps success', async () => {
    const processBillPayment = vi.fn().mockResolvedValue({
      data: { success: true, transactionId: 'bill-tx-1' },
    })
    callableMock.mockReturnValueOnce(processBillPayment)

    const payload = {
      accountId: 'account-1',
      billerId: 'electricity-bill',
      amount: 500,
      currency: 'YER',
      reference: 'bill-ref-1',
    }

    const result = await payBill(payload)

    expect(callableMock).toHaveBeenCalledWith({}, 'processBillPayment')
    expect(processBillPayment).toHaveBeenCalledWith(payload)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ success: true, transactionId: 'bill-tx-1' })
  })

  it('uses targetUserId when changing a role', async () => {
    const setRole = vi.fn().mockResolvedValue({ data: undefined })
    callableMock.mockReturnValueOnce(setRole)

    const result = await setUserRole('target-user-1', 'agent')

    expect(callableMock).toHaveBeenCalledWith({}, 'setUserRole')
    expect(setRole).toHaveBeenCalledWith({
      targetUserId: 'target-user-1',
      role: 'agent',
    })
    expect(result).toEqual({ success: true, message: 'تم تحديث الصلاحية بنجاح' })
  })

  it('returns the Cloud Function error when role update is denied', async () => {
    const setRole = vi.fn().mockRejectedValue(new Error('Insufficient permissions.'))
    callableMock.mockReturnValueOnce(setRole)

    const result = await setUserRole('target-user-1', 'agent')

    expect(result).toEqual({ success: false, error: 'Insufficient permissions.' })
  })
})
