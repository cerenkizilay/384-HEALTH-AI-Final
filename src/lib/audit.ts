import type { AuditActionType, Role } from './models'
import { apiCreateAudit } from './api'
import { nowIso, uid } from './utils'

export function audit(params: {
  userId?: string
  role?: Role
  actionType: AuditActionType
  targetEntity?: string
  result: 'success' | 'failure'
  details?: string
}): void {
  apiCreateAudit({
    id: uid('log'),
    at: nowIso(),
    userId: params.userId,
    role: params.role,
    actionType: params.actionType,
    targetEntity: params.targetEntity,
    result: params.result,
    details: params.details,
  }).catch(() => {})
}
