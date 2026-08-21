import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useAppStore } from '@/store/appStore'

/**
 * Attaches the store's Firestore onSnapshot listeners once a user is signed
 * in, and tears them down on sign-out. Mounted once in AppLayout, which only
 * renders behind ProtectedRoute — so by the time this runs, Firestore reads
 * are already authorized by the security rules.
 */
export function useFirestoreSync() {
  const { user, profile } = useAuth()
  const initFirestoreSync = useAppStore((s) => s.initFirestoreSync)
  const setCurrentActor = useAppStore((s) => s.setCurrentActor)

  useEffect(() => {
    if (!user) return
    const stop = initFirestoreSync()
    return stop
  }, [user, initFirestoreSync])

  useEffect(() => {
    if (profile) setCurrentActor(profile.name)
  }, [profile, setCurrentActor])
}
