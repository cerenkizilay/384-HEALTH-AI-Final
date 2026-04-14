import type { AuditActionType, AuditLog, Role } from './models'
import { db } from './db'
import { nowIso, uid } from './utils'

export function audit(params: {
  userId?: string
  role?: Role
  actionType: AuditActionType
  targetEntity?: string
  result: 'success' | 'failure'
  details?: string
}) {
  const entry: AuditLog = {
    id: uid('log'),
    at: nowIso(),
    userId: params.userId,
    role: params.role,
    actionType: params.actionType,
    targetEntity: params.targetEntity,
    result: params.result,
    details: params.details,
  }
  db.update((d) => {
    d.logs.unshift(entry)
    // keep logs bounded in demo
    d.logs = d.logs.slice(0, 2000)
  })
}

