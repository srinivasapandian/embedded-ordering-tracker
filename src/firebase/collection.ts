import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'

export { writeBatch }

/**
 * Generic Firestore access for the app's flat, ISO-string-dated collections
 * (clients, websites, migrations, priorities, auditLogs, notifications).
 * Every document's field shape matches its TS interface exactly — no
 * Timestamp conversion needed, since dates are stored as ISO strings just
 * like the rest of the app already expects.
 */

interface SubscribeOptions {
  /** Field to sort by, newest/highest first. */
  orderByField?: string
  /** Cap the number of docs returned (paired with orderByField). */
  max?: number
}

/** Subscribes to every doc in `path` and reports the full list on every change. */
export function subscribeCollection<T extends { id: string }>(
  path: string,
  onChange: (items: T[]) => void,
  options?: SubscribeOptions,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const target = options?.orderByField
    ? query(collection(db, path), orderBy(options.orderByField, 'desc'), ...(options.max ? [fsLimit(options.max)] : []))
    : collection(db, path)
  return onSnapshot(
    target,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)
      onChange(items)
    },
    onError,
  )
}

/** Creates a new doc with an auto-generated id and returns it. */
export async function addNewDoc(path: string, data: DocumentData): Promise<string> {
  const ref = await addDoc(collection(db, path), data)
  return ref.id
}

/** Creates or overwrites a doc at a known id. */
export async function setDocAt(path: string, id: string, data: DocumentData): Promise<void> {
  await setDoc(doc(db, path, id), data)
}

/** Partial update of an existing doc. */
export async function patchDoc(path: string, id: string, patch: DocumentData): Promise<void> {
  await updateDoc(doc(db, path, id), patch)
}

export async function removeDoc(path: string, id: string): Promise<void> {
  await deleteDoc(doc(db, path, id))
}

/** Reference for use inside a writeBatch (cascading deletes, multi-doc updates). */
export function refAt(path: string, id: string) {
  return doc(db, path, id)
}

/** A fresh doc ref with a client-generated id — no network call yet, so its
 *  `.id` can be used for cross-references inside the same batch (e.g. a new
 *  client's id, needed by the website doc created alongside it). */
export function newRef(path: string) {
  return doc(collection(db, path))
}

export function newSubRef(parentPath: string, parentId: string, subcollection: string) {
  return doc(collection(db, parentPath, parentId, subcollection))
}

export function newBatch() {
  return writeBatch(db)
}

/** Appends an entry to an append-only subcollection (client activity, migration logs). */
export async function addSubDoc(parentPath: string, parentId: string, subcollection: string, data: DocumentData): Promise<string> {
  const ref = await addDoc(collection(db, parentPath, parentId, subcollection), data)
  return ref.id
}

/** Subscribes to a subcollection, newest-first, capped at `max` entries. */
export function subscribeSubCollection<T extends { id: string }>(
  parentPath: string,
  parentId: string,
  subcollection: string,
  dateField: string,
  onChange: (items: T[]) => void,
  max = 50,
): Unsubscribe {
  const q = query(collection(db, parentPath, parentId, subcollection), orderBy(dateField, 'desc'), fsLimit(max))
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
  })
}

/** Doc refs of every entry in a subcollection — used to fold a cascading
 *  delete of e.g. clients/{id}/activity into the same batch as its parent. */
export async function collectSubDocRefs(
  parentPath: string,
  parentId: string,
  subcollection: string,
): Promise<DocumentReference[]> {
  const snap = await getDocs(collection(db, parentPath, parentId, subcollection))
  return snap.docs.map((d) => d.ref)
}

export function nowIso(): string {
  return new Date().toISOString()
}
