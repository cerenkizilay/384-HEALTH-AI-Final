import type { Role, User } from './models'
import { audit } from './audit'
import { db } from './db'
import { readJson, writeJson } from './storage'
import { isInstitutionalEduEmail, nowIso, uid } from './utils'

const SESSION_KEY = 'healthai_session_v1'

type Session = { userId: string } | null

export function getSession(): Session {
  return readJson<Session>(SESSION_KEY, null)
}

export function getCurrentUser(): User | null {
  const session = getSession()
  if (!session) return null
  const u = db.get().users.find((x) => x.id === session.userId) ?? null
  if (!u || u.suspended) return null
  return u
}

export function logout() {
  const u = getCurrentUser()
  if (u) audit({ userId: u.id, role: u.role, actionType: 'logout', result: 'success' })
  writeJson(SESSION_KEY, null)
}

export function login(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  const u = db.get().users.find((x) => x.email === email) ?? null
  if (!u) {
    audit({ actionType: 'failed_login', result: 'failure', details: `email_not_found:${email}` })
    throw new Error('No account found for this email.')
  }
  if (u.suspended) throw new Error('Account is suspended.')
  if (!u.verified) throw new Error('Please verify your email before logging in.')
  writeJson(SESSION_KEY, { userId: u.id })
  audit({ userId: u.id, role: u.role, actionType: 'login', result: 'success' })
}

export function register(params: { name: string; email: string; role: Exclude<Role, 'admin'> }) {
  const name = params.name.trim()
  const email = params.email.trim().toLowerCase()
  if (!name) throw new Error('Name is required.')
  if (!isInstitutionalEduEmail(email)) throw new Error('Registration is restricted to institutional .edu emails.')
  const existing = db.get().users.find((x) => x.email === email)
  if (existing) throw new Error('An account with this email already exists.')

  const u: User = {
    id: uid('usr'),
    email,
    name,
    role: params.role,
    verified: false,
    suspended: false,
    createdAt: nowIso(),
  }
  db.update((d) => {
    d.users.push(u)
  })
  audit({ userId: u.id, role: u.role, actionType: 'register', result: 'success' })
  return u
}

export function verifyEmail(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  const u = db.get().users.find((x) => x.email === email) ?? null
  if (!u) throw new Error('No account found for this email.')
  db.update((d) => {
    const idx = d.users.findIndex((x) => x.id === u.id)
    d.users[idx] = { ...d.users[idx], verified: true }
  })
  audit({ userId: u.id, role: u.role, actionType: 'verify_email', result: 'success' })
}

