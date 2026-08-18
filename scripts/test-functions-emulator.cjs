const { generateKeyPairSync } = require('node:crypto')
const { spawnSync } = require('node:child_process')
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')

const tempDir = mkdtempSync(join(tmpdir(), 'shik-firebase-'))
const credentialsPath = join(tempDir, 'service-account.json')

try {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  })

  writeFileSync(credentialsPath, JSON.stringify({
    type: 'service_account',
    project_id: 'demo-shik',
    private_key_id: 'local-test',
    private_key: privateKey,
    client_email: 'local-test@demo-shik.iam.gserviceaccount.com',
    client_id: '1234567890',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  }))

  const result = spawnSync('firebase', [
    'emulators:exec',
    '--only',
    'auth,firestore,functions',
    '--project',
    'demo-shik',
    'node scripts/cloud-functions-emulator-smoke.cjs',
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      GOOGLE_APPLICATION_CREDENTIALS: credentialsPath,
      NODE_OPTIONS: [process.env.NODE_OPTIONS, '--no-deprecation']
        .filter(Boolean)
        .join(' '),
    },
  })

  process.exitCode = result.status ?? 1
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
