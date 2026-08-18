const assert = require('node:assert/strict')
const admin = require('../functions/node_modules/firebase-admin')

const projectId = 'demo-shik'
const authUrl = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key'
const functionsBase = 'http://127.0.0.1:5001/demo-shik/us-central1'

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
admin.initializeApp({ projectId })
const db = admin.firestore()

async function callJson(url, options) {
  const response = await fetch(url, options)
  const body = await response.json()
  assert.equal(response.ok, true, `${url} returned HTTP ${response.status}: ${JSON.stringify(body)}`)
  return body
}

async function main() {
  const auth = await callJson(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `smoke-${Date.now()}@shik.local`,
      password: 'TestPass123!',
      returnSecureToken: true,
    }),
  })

  const uid = auth.localId
  const token = auth.idToken
  assert.ok(uid)
  assert.ok(token)

  await db.collection('accounts').doc('smoke-source').set({
    userId: uid,
    accountNumber: '111111111',
    type: 'wallet',
    currency: 'YER',
    balance: 10000,
    reservedBalance: 0,
    status: 'active',
  })
  await db.collection('accounts').doc('smoke-target').set({
    userId: 'other-user',
    accountNumber: '222222222',
    type: 'wallet',
    currency: 'YER',
    balance: 0,
    reservedBalance: 0,
    status: 'active',
  })
  await db.collection('bills').doc('smoke-bill').set({ name: 'Smoke bill', active: true })

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const transfer = await callJson(`${functionsBase}/transferMoney`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: {
        fromAccountId: 'smoke-source',
        toAccountNumber: '222222222',
        amount: 1000,
        currency: 'YER',
        idempotencyKey: 'smoke-transfer-1',
      },
    }),
  })
  assert.equal(transfer.result.success, true)

  const billPayment = await callJson(`${functionsBase}/processBillPayment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: {
        accountId: 'smoke-source',
        billerId: 'smoke-bill',
        amount: 500,
        currency: 'YER',
        reference: 'smoke-bill-1',
      },
    }),
  })
  assert.equal(billPayment.result.success, true)

  const source = (await db.doc('accounts/smoke-source').get()).data()
  const target = (await db.doc('accounts/smoke-target').get()).data()
  assert.equal(source.balance, 8500)
  assert.equal(target.balance, 1000)

  const transactions = await db.collection('transactions').get()
  assert.equal(transactions.size, 2)

  console.log('cloud-functions-emulator-smoke: passed')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
