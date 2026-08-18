import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)
export const storage = getStorage(app)

// Initialize Analytics only in a browser with a valid measurement ID.
export const getAnalyticsInstance = async () => {
  if (typeof window === 'undefined' || !firebaseConfig.measurementId) {
    return null
  }
  const supported = await isAnalyticsSupported()
  return supported ? getAnalytics(app) : null
}

// Initialize messaging only if supported
export const getMessagingInstance = async () => {
  const supported = await isMessagingSupported()
  if (supported) {
    return getMessaging(app)
  }
  return null
}

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectFunctionsEmulator(functions, 'localhost', 5001)
  connectStorageEmulator(storage, 'localhost', 9199)
}

export default app
