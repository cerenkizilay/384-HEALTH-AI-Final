import type { MeetingRequest } from './models'
import { apiCreateMeeting, apiUpdateMeeting } from './api'
import { audit } from './audit'
import { nowIso, uid } from './utils'

export async function createMeetingRequest(params: {
  postId: string
  fromUserId: string
  toUserId: string
  ndaAccepted: boolean
  proposedSlots: string[]
}): Promise<MeetingRequest> {
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
  const created = await apiCreateMeeting(mr)
  audit({ userId: params.fromUserId, actionType: 'meeting_request_create', result: 'success', targetEntity: created.id })
  return created
}

export async function updateMeetingRequest(params: {
  meetingId: string
  actingUserId: string
  status?: 'accepted' | 'declined' | 'cancelled'
  selectedSlot?: string
}): Promise<void> {
  const at = nowIso()
  const patch: Partial<MeetingRequest> = { updatedAt: at }
  if (params.status) patch.status = params.status
  if (params.selectedSlot) patch.selectedSlot = params.selectedSlot
  await apiUpdateMeeting(params.meetingId, patch)
  audit({ userId: params.actingUserId, actionType: 'meeting_request_update', result: 'success', targetEntity: params.meetingId })
}
