import type { AuditLog, ChatMessage, InterestMessage, MeetingRequest, Post, User } from './models'

const BASE =
  (import.meta.env.VITE_AUTH_API_URL as string | undefined)?.trim() ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://healthai-auth-api.onrender.com'
    : 'http://localhost:4000')

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { message?: string }).message || 'Request failed')
  return data as T
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function apiGetAllUsers(): Promise<User[]> {
  return request<User[]>('GET', '/api/users')
}

export async function apiGetUser(id: string): Promise<User> {
  return request<User>('GET', `/api/users/${encodeURIComponent(id)}`)
}

export async function apiGetUserByEmail(email: string): Promise<User | null> {
  try {
    return await request<User>('GET', `/api/users/by-email/${encodeURIComponent(email)}`)
  } catch {
    return null
  }
}

export async function apiCreateUser(u: User): Promise<User> {
  return request<User>('POST', '/api/users', u)
}

export async function apiUpdateUser(id: string, patch: Partial<User>): Promise<User> {
  return request<User>('PUT', `/api/users/${encodeURIComponent(id)}`, patch)
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function apiGetPosts(): Promise<Post[]> {
  return request<Post[]>('GET', '/api/posts')
}

export async function apiGetUserPosts(userId: string): Promise<Post[]> {
  return request<Post[]>('GET', `/api/posts/user/${encodeURIComponent(userId)}`)
}

export async function apiGetPost(id: string): Promise<Post | null> {
  try {
    return await request<Post>('GET', `/api/posts/${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

export async function apiCreatePost(p: Post): Promise<Post> {
  return request<Post>('POST', '/api/posts', p)
}

export async function apiUpdatePost(id: string, patch: Partial<Post>): Promise<Post> {
  return request<Post>('PUT', `/api/posts/${encodeURIComponent(id)}`, patch)
}

export async function apiDeletePost(id: string): Promise<void> {
  await request<unknown>('DELETE', `/api/posts/${encodeURIComponent(id)}`)
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export async function apiGetMeetingsForPost(postId: string): Promise<MeetingRequest[]> {
  return request<MeetingRequest[]>('GET', `/api/meetings/post/${encodeURIComponent(postId)}`)
}

export async function apiGetMeetingsForUser(userId: string): Promise<MeetingRequest[]> {
  return request<MeetingRequest[]>('GET', `/api/meetings/user/${encodeURIComponent(userId)}`)
}

export async function apiCreateMeeting(m: MeetingRequest): Promise<MeetingRequest> {
  return request<MeetingRequest>('POST', '/api/meetings', m)
}

export async function apiUpdateMeeting(id: string, patch: Partial<MeetingRequest>): Promise<MeetingRequest> {
  return request<MeetingRequest>('PUT', `/api/meetings/${encodeURIComponent(id)}`, patch)
}

// ─── Chats ────────────────────────────────────────────────────────────────────

export async function apiGetChats(meetingId: string): Promise<ChatMessage[]> {
  return request<ChatMessage[]>('GET', `/api/chats/${encodeURIComponent(meetingId)}`)
}

export async function apiSendChat(msg: ChatMessage): Promise<ChatMessage> {
  return request<ChatMessage>('POST', '/api/chats', msg)
}

// ─── Interests ────────────────────────────────────────────────────────────────

export async function apiCreateInterest(i: InterestMessage): Promise<InterestMessage> {
  return request<InterestMessage>('POST', '/api/interests', i)
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function apiGetAuditLogs(): Promise<AuditLog[]> {
  return request<AuditLog[]>('GET', '/api/audit')
}

export async function apiCreateAudit(log: AuditLog): Promise<void> {
  await request<unknown>('POST', '/api/audit', log)
}
