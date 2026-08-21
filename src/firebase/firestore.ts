import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc, Timestamp, type Unsubscribe } from 'firebase/firestore'
import type { Role, UserProfile } from '@/types'
import { db } from './config'

/** Firestore Timestamp -> app-facing ISO string (app types use ISO strings throughout). */
export function tsToIso(value: Timestamp | string | null | undefined): string {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  return value.toDate().toISOString()
}

export const usersCollection = 'users'

function userDocRef(uid: string) {
  return doc(db, usersCollection, uid)
}

/** Palette used to give a new self-provisioned profile a stable-looking avatar color. */
const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-amber-500', 'bg-orange-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-cyan-500',
]
function colorForUid(uid: string): string {
  let h = 0
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDocRef(uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid,
    name: data.name,
    email: data.email,
    role: data.role,
    title: data.title ?? '',
    color: data.color ?? colorForUid(uid),
    active: data.active ?? true,
    createdAt: tsToIso(data.createdAt),
  }
}

/**
 * Self-provisioning bootstrap: the first time a signed-in user has no
 * `users/{uid}` doc yet, create one with the lowest-privilege role
 * ('viewer'). This lets any authenticated account log in without a manual
 * Firestore write for every teammate — an existing super-admin (or you,
 * manually, for the very first account) then raises their role from the
 * Admin Panel's Team management. Firestore rules only allow a user to
 * create their *own* doc, and only a super-admin can change a `role` field
 * afterward, so this can't be used for self-elevation.
 */
export async function ensureUserProfile(uid: string, email: string | null): Promise<UserProfile> {
  const existing = await fetchUserProfile(uid)
  if (existing) return existing
  const name = email ? email.split('@')[0]! : 'New user'
  await setDoc(userDocRef(uid), {
    name,
    email: email ?? '',
    role: 'viewer' as Role,
    title: '',
    color: colorForUid(uid),
    active: true,
    createdAt: serverTimestamp(),
  })
  const created = await fetchUserProfile(uid)
  if (!created) throw new Error('Failed to create user profile')
  return created
}

function toUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    name: (data.name as string) ?? '',
    email: (data.email as string) ?? '',
    role: (data.role as Role) ?? 'viewer',
    title: (data.title as string) ?? '',
    color: (data.color as string) ?? colorForUid(uid),
    active: (data.active as boolean) ?? true,
    createdAt: tsToIso(data.createdAt as Timestamp | undefined),
  }
}

/** Live list of every teammate profile — the Firebase-backed replacement for the old local `teamMembers` seed. */
export function subscribeUserProfiles(onChange: (profiles: UserProfile[]) => void): Unsubscribe {
  return onSnapshot(collection(db, usersCollection), (snap) => {
    onChange(snap.docs.map((d) => toUserProfile(d.id, d.data())))
  })
}

export async function patchUserProfile(uid: string, patch: Partial<Pick<UserProfile, 'name' | 'title' | 'color' | 'role' | 'active'>>): Promise<void> {
  await setDoc(userDocRef(uid), patch, { merge: true })
}
