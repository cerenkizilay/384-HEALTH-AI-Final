import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Role } from '../lib/models'
import { getCurrentUser } from '../lib/auth'

export function RequireRole(props: { role: Role; children: ReactNode }) {
  const u = getCurrentUser()
  if (!u) return <Navigate to="/login" replace />
  if (u.role !== props.role) return <Navigate to="/posts" replace />
  return props.children
}

