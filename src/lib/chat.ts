import type { ChatMessage } from './models'
import { db } from './db'
import { nowIso, uid } from './utils'

/** Meeting'e ait mesajları eskiden yeniye sıralı döndürür */
export function getMessages(meetingId: string): ChatMessage[] {
  const data = db.get()
  // Mevcut DB'lerde chats alanı olmayabilir — güvenli fallback
  const chats = data.chats ?? []
  return chats.filter((m) => m.meetingId === meetingId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
}

/** Yeni mesaj gönder. Kullanıcı meeting'in tarafı olmalı. */
export function sendMessage(params: { meetingId: string; fromUserId: string; text: string }): ChatMessage {
  const text = params.text.trim()
  if (!text) throw new Error('Message cannot be empty.')
  if (text.length > 2000) throw new Error('Message must be 2000 characters or fewer.')

  const meeting = db.get().meetings.find((m) => m.id === params.meetingId)
  if (!meeting) throw new Error('Meeting not found.')
  if (meeting.status !== 'accepted') throw new Error('Chat is only available for accepted meeting requests.')
  const isParty = meeting.fromUserId === params.fromUserId || meeting.toUserId === params.fromUserId
  if (!isParty) throw new Error('You do not have access to this chat.')

  const msg: ChatMessage = {
    id: uid('msg'),
    meetingId: params.meetingId,
    fromUserId: params.fromUserId,
    text,
    createdAt: nowIso(),
  }

  db.update((d) => {
    if (!d.chats) d.chats = []
    d.chats.push(msg)
  })

  return msg
}
