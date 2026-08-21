import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Permission, UserProfile } from '@/types'
import { ROLE_PERMISSIONS } from '@/types'
import { signIn, signOutUser, subscribeToAuthState, type User } from '@/firebase/auth'
import { ensureUserProfile } from '@/firebase/firestore'

interface AuthContextValue {
  /** Firebase Auth user — null while signed out. */
  user: User | null
  /** Firestore users/{uid} profile — null while signed out or still loading. */
  profile: UserProfile | null
  /** True until the initial auth check (and profile fetch) has resolved. */
  loading: boolean
  can: (permission: Permission) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }
      setLoading(true)
      ensureUserProfile(nextUser.uid, nextUser.email)
        .then(setProfile)
        .finally(() => setLoading(false))
    })
    return unsubscribe
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      can: (permission) => (profile ? ROLE_PERMISSIONS[profile.role].includes(permission) : false),
      login: async (email, password) => {
        await signIn(email, password)
      },
      logout: async () => {
        await signOutUser()
      },
    }),
    [user, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
