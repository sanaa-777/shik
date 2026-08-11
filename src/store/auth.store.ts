import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/config/firebase'
import type { UserProfile } from '@/types'
import { getUserProfile } from '@/services/auth.service'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  init: () => () => void
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  init: () => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        set({ user, loading: true })

        try {
          if (user) {
            const result = await getUserProfile(user.uid)
            set({
              profile: result.success && result.data ? result.data : null,
              loading: false,
            })
          } else {
            set({ profile: null, loading: false })
          }
        } catch {
          set({ profile: null, loading: false })
        }
      }, () => {
        set({ user: null, profile: null, loading: false })
      })

      return unsubscribe
    } catch {
      set({ user: null, profile: null, loading: false })
      return () => undefined
    }
  },

  isAdmin: () => {
    const { profile } = get()
    return profile?.role === 'admin' || profile?.role === 'super_admin'
  },

  isSuperAdmin: () => {
    const { profile } = get()
    return profile?.role === 'super_admin'
  },
}))
