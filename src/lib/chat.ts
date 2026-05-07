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
  if (!text) throw new Error('Mesaj boş olamaz.')
  if (text.length > 2000) throw new Error('Mesaj en fazla 2000 karakter olabilir.')

  // Kullanıcının bu meeting'in tarafı olduğunu doğrula
  const meeting = db.get().meetings.find((m) => m.id === params.meetingId)
  if (!meeting) throw new Error('Meeting bulunamadı.')
  if (meeting.status !== 'accepted') throw new Error('Chat sadece kabul edilmiş meeting requestlarda aktiftir.')
  const isParty = meeting.fromUserId === params.fromUserId || meeting.toUserId === params.fromUserId
  if (!isParty) throw new Error('Bu sohbete erişim yetkiniz yok.')

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
