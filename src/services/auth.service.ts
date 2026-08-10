import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'
import type { UserProfile, LoginFormData, RegisterFormData, ApiResponse } from '@/types'

/**
 * Login with phone and password
 */
export async function login(data: LoginFormData): Promise<ApiResponse<User>> {
  try {
    // Phone format: convert to email format for Firebase Auth
    const email = `${data.phone.replace(/[^0-9]/g, '')}@digitalbank.ye`
    const credential = await signInWithEmailAndPassword(auth, email, data.password)
    return { success: true, data: credential.user, message: 'تم تسجيل الدخول بنجاح' }
  } catch (error: unknown) {
    const message = getAuthErrorMessage(error as { code: string })
    return { success: false, error: message }
  }
}

/**
 * Register new user
 */
export async function register(data: RegisterFormData): Promise<ApiResponse<User>> {
  try {
    const email = `${data.phone.replace(/[^0-9]/g, '')}@digitalbank.ye`
    const credential = await createUserWithEmailAndPassword(auth, email, data.password)

    // Update display name
    await updateProfile(credential.user, { displayName: data.displayName })

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', credential.user.uid), {
      displayName: data.displayName,
      phone: data.phone,
      email: data.email || null,
      role: 'customer',
      status: 'active',
      kyc: { verified: false, level: 'none', documents: [] },
      settings: { language: 'ar', notifications: true, biometric: false },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create default wallet account
    await setDoc(doc(db, 'accounts', `${credential.user.uid}_wallet`), {
      userId: credential.user.uid,
      type: 'wallet',
      currency: 'YER',
      balance: 0,
      status: 'active',
      accountNumber: generateAccountNumber(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return { success: true, data: credential.user, message: 'تم إنشاء الحساب بنجاح' }
  } catch (error: unknown) {
    const message = getAuthErrorMessage(error as { code: string })
    return { success: false, error: message }
  }
}

/**
 * Logout
 */
export async function logout(): Promise<ApiResponse<void>> {
  try {
    await signOut(auth)
    return { success: true, message: 'تم تسجيل الخروج' }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء تسجيل الخروج' }
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(phone: string): Promise<ApiResponse<void>> {
  try {
    const email = `${phone.replace(/[^0-9]/g, '')}@digitalbank.ye`
    await sendPasswordResetEmail(auth, email)
    return { success: true, message: 'تم إرسال رابط إعادة تعيين كلمة المرور' }
  } catch (error: unknown) {
    const message = getAuthErrorMessage(error as { code: string })
    return { success: false, error: message }
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
  try {
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return { success: false, error: 'الملف الشخصي غير موجود' }
    }

    const data = docSnap.data()
    const profile: UserProfile = {
      id: docSnap.id,
      displayName: data.displayName,
      phone: data.phone,
      email: data.email,
      avatar: data.avatar,
      nationalId: data.nationalId,
      address: data.address,
      role: data.role,
      status: data.status,
      kyc: data.kyc,
      settings: data.settings,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }

    return { success: true, data: profile }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء جلب البيانات' }
  }
}

/**
 * Generate account number
 */
function generateAccountNumber(): string {
  const prefix = '967'
  const random = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return prefix + random
}

/**
 * Get user-friendly auth error message
 */
function getAuthErrorMessage(error: { code: string }): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'رقم الهاتف مسجل بالفعل',
    'auth/invalid-email': 'رقم الهاتف غير صالح',
    'auth/user-not-found': 'رقم الهاتف أو كلمة المرور غير صحيحة',
    'auth/wrong-password': 'رقم الهاتف أو كلمة المرور غير صحيحة',
    'auth/weak-password': 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل',
    'auth/too-many-requests': 'تم تجاوز عدد المحاولات، حاول لاحقاً',
    'auth/network-request-failed': 'خطأ في الاتصال بالشبكة',
    'auth/invalid-credential': 'بيانات الدخول غير صحيحة',
  }
  return messages[error.code] || 'حدث خطأ غير متوقع'
}
