import type { ChatMessage } from './models'
import { apiGetChats, apiSendChat } from './api'
import { nowIso, uid } from './utils'

export async function getMessages(meetingId: string): Promise<ChatMessage[]> {
  return apiGetChats(meetingId)
}

export async function sendMessage(params: {
  meetingId: string
  fromUserId: string
  text: string
}): Promise<ChatMessage> {
  const text = params.text.trim()
  if (!text) throw new Error('Message cannot be empty.')
  if (text.length > 2000) throw new Error('Message must be 2000 characters or fewer.')

  const msg: ChatMessage = {
    id: uid('msg'),
    meetingId: params.meetingId,
    fromUserId: params.fromUserId,
    text,
    createdAt: nowIso(),
  }
  return apiSendChat(msg)
}
