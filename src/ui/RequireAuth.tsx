import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../lib/auth'

export function RequireAuth(props: { children: ReactNode }) {
  const u = getCurrentUser()
  const loc = useLocation()
  if (!u) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return props.children
}

