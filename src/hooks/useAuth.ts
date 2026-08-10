import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

/**
 * Hook to protect routes - redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { user, profile, loading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

  return { user, profile, loading }
}

/**
 * Hook to redirect if already authenticated
 */
export function useRedirectIfAuth(redirectTo: string = '/dashboard') {
  const { user, loading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, loading, navigate, redirectTo])

  return { loading }
}

/**
 * Hook for admin-only routes
 */
export function useRequireAdmin() {
  const { user, profile, loading, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true })
      } else if (!isAdmin()) {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, loading, navigate, isAdmin])

  return { user, profile, loading, isAdmin: isAdmin() }
}
