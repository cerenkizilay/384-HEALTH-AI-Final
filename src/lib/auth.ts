import type { Role, User } from './models'
import { apiCreateAudit, apiCreateUser, apiGetUserByEmail, apiUpdateUser } from './api'
import { readJson, writeJson } from './storage'
import { isInstitutionalEduEmail, nowIso, uid } from './utils'

const SESSION_KEY = 'healthai_session_v1'

type Session = { userId: string; user: User } | null

export function getSession(): Session {
  return readJson<Session>(SESSION_KEY, null)
}

export function getCurrentUser(): User | null {
  const session = getSession()
  if (!session) return null
  // Guard against old session format that didn't have `user` field
  const u = (session as { userId: string; user?: User }).user
  if (!u || u.suspended) return null
  return u
}

export function logout() {
  const u = getCurrentUser()
  if (u) {
    apiCreateAudit({
      id: uid('log'),
      at: nowIso(),
      userId: u.id,
      role: u.role,
      actionType: 'logout',
      result: 'success',
    }).catch(() => {})
  }
  writeJson(SESSION_KEY, null)
}

export async function login(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase()
  const u = await apiGetUserByEmail(email)
  if (!u) {
    apiCreateAudit({
      id: uid('log'),
      at: nowIso(),
      actionType: 'failed_login',
      result: 'failure',
      details: `email_not_found:${email}`,
    }).catch(() => {})
    throw new Error('No account found for this email.')
  }
  if (u.suspended) throw new Error('Account is suspended.')
  if (!u.verified) throw new Error('Please verify your email before logging in.')
  writeJson(SESSION_KEY, { userId: u.id, user: u })
  apiCreateAudit({
    id: uid('log'),
    at: nowIso(),
    userId: u.id,
    role: u.role,
    actionType: 'login',
    result: 'success',
  }).catch(() => {})
}

export async function register(params: { name: string; email: string; role: Exclude<Role, 'admin'> }): Promise<User> {
  const name = params.name.trim()
  const email = params.email.trim().toLowerCase()
  if (!name) throw new Error('Name is required.')
  if (!isInstitutionalEduEmail(email)) throw new Error('Please enter a valid email address.')

  const existing = await apiGetUserByEmail(email)
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

  const created = await apiCreateUser(u)
  writeJson(SESSION_KEY, { userId: created.id, user: created })
  apiCreateAudit({
    id: uid('log'),
    at: nowIso(),
    userId: created.id,
    role: created.role,
    actionType: 'register',
    result: 'success',
  }).catch(() => {})
  return created
}

export async function verifyEmail(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase()
  const session = getSession()
  // Find the user — first try from session, then by email lookup if needed
  let userId: string | undefined
  if (session?.user?.email === email) {
    userId = session.user.id
  } else {
    const u = await apiGetUserByEmail(email)
    if (!u) throw new Error('No account found for this email.')
    userId = u.id
  }

  const updated = await apiUpdateUser(userId, { verified: true })

  // Update session user if it matches
  if (session && session.userId === userId) {
    writeJson(SESSION_KEY, { userId, user: { ...session.user, verified: true } })
  }

  apiCreateAudit({
    id: uid('log'),
    at: nowIso(),
    userId: updated.id,
    role: updated.role,
    actionType: 'verify_email',
    result: 'success',
  }).catch(() => {})
}

const AUTH_API_BASE =
  (import.meta.env.VITE_AUTH_API_URL as string | undefined)?.trim() ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://healthai-auth-api.onrender.com'
    : 'http://localhost:4000')

export async function requestEmailVerificationCode(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  const res = await fetch(`${AUTH_API_BASE}/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) throw new Error(data.message || 'Failed to send verification code.')
}

export async function confirmEmailVerificationCode(emailRaw: string, codeRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  const code = codeRaw.trim()
  const res = await fetch(`${AUTH_API_BASE}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  const data = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) throw new Error(data.message || 'Verification failed.')

  await verifyEmail(email)
}
