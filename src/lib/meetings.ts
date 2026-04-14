import type { MeetingRequest } from './models'
import { audit } from './audit'
import { db } from './db'
import { nowIso, uid } from './utils'

export function createMeetingRequest(params: {
  postId: string
  fromUserId: string
  toUserId: string
  ndaAccepted: boolean
  proposedSlots: string[]
}) {
  if (!params.ndaAccepted) throw new Error('You must accept the NDA to send a meeting request.')
  if (params.proposedSlots.length === 0) throw new Error('Please propose at least one time slot.')

  const at = nowIso()
  const mr: MeetingRequest = {
    id: uid('mtg'),
    postId: params.postId,
    fromUserId: params.fromUserId,
    toUserId: params.toUserId,
    ndaAccepted: true,
    proposedSlots: params.proposedSlots,
    status: 'pending',
    createdAt: at,
    updatedAt: at,
  }
  db.update((d) => {
    d.meetings.unshift(mr)
  })
  audit({ userId: params.fromUserId, actionType: 'meeting_request_create', result: 'success', targetEntity: mr.id })
  return mr
}

export function updateMeetingRequest(params: {
  meetingId: string
  actingUserId: string
  status?: 'accepted' | 'declined' | 'cancelled'
  selectedSlot?: string
}) {
  const at = nowIso()
  db.update((d) => {
    const idx = d.meetings.findIndex((m) => m.id === params.meetingId)
    if (idx < 0) throw new Error('Meeting request not found.')
    const cur = d.meetings[idx]
    const isParty = cur.fromUserId === params.actingUserId || cur.toUserId === params.actingUserId
    if (!isParty) throw new Error('Not allowed.')
    const next: MeetingRequest = { ...cur, updatedAt: at }
    if (params.status) next.status = params.status
    if (params.selectedSlot) next.selectedSlot = params.selectedSlot
    d.meetings[idx] = next
  })
  audit({ userId: params.actingUserId, actionType: 'meeting_request_update', result: 'success', targetEntity: params.meetingId })
}

