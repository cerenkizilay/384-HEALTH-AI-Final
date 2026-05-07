import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { db } from '../../lib/db'
import { getMessages, sendMessage } from '../../lib/chat'
import type { ChatMessage, MeetingRequest, User } from '../../lib/models'
import { Card } from '../components/Ui'

// ─── Time formatter ───────────────────────────────────────────────────────────
function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble(props: { msg: ChatMessage; isMine: boolean; senderName: string }) {
  const { msg, isMine, senderName } = props
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
          isMine ? 'bg-teal-600' : 'bg-slate-400'
        }`}
      >
        {senderName.charAt(0).toUpperCase()}
      </div>

      {/* Bubble */}
      <div className={`max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isMine && (
          <span className="ml-1 text-xs text-slate-400">{senderName}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isMine
              ? 'rounded-br-sm bg-teal-600 text-white'
              : 'rounded-bl-sm bg-white text-slate-800 border border-slate-200'
          }`}
        >
          {msg.text}
        </div>
        <span className={`px-1 text-[11px] text-slate-400 ${isMine ? 'text-right' : 'text-left'}`}>
          {formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  )
}

// ─── ChatPage ─────────────────────────────────────────────────────────────────
export function ChatPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const u = getCurrentUser()!

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const data = db.get()
  const meeting: MeetingRequest | undefined = data.meetings.find((m) => m.id === meetingId)
  const post = meeting ? data.posts.find((p) => p.id === meeting.postId) : undefined
  const otherUserId = meeting
    ? meeting.fromUserId === u.id
      ? meeting.toUserId
      : meeting.fromUserId
    : undefined
  const other: User | undefined = otherUserId ? data.users.find((x) => x.id === otherUserId) : undefined

  const isParty = meeting && (meeting.fromUserId === u.id || meeting.toUserId === u.id)
  const chatActive = meeting?.status === 'accepted'

  // Load messages + poll every 2s
  useEffect(() => {
    if (!meetingId || !chatActive) return
    const load = () => setMessages(getMessages(meetingId))
    load()
    const interval = window.setInterval(load, 2000)
    return () => window.clearInterval(interval)
  }, [meetingId, chatActive])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Error states ──────────────────────────────────────────────────────────
  if (!meeting || !isParty) {
    return (
      <Card className="p-8 text-center">
        <div className="text-sm text-slate-500">You don't have access to this chat.</div>
        <Link to="/posts" className="mt-4 inline-block text-sm text-teal-600 hover:underline">
          ← Back to announcements
        </Link>
      </Card>
    )
  }

  if (!chatActive) {
    return (
      <Card className="p-8 text-center">
        <div className="text-sm text-slate-500">
          Chat is only available for accepted meeting requests.
        </div>
        <Link
          to={`/posts/${meeting.postId}`}
          className="mt-4 inline-block text-sm text-teal-600 hover:underline"
        >
          ← Back to post
        </Link>
      </Card>
    )
  }

  // ── Send message ──────────────────────────────────────────────────────────
  function handleSend() {
    if (!text.trim() || sending || !meetingId) return
    setSending(true)
    setError(null)
    try {
      sendMessage({ meetingId, fromUserId: u.id, text })
      setText('')
      setMessages(getMessages(meetingId))
      inputRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex h-[calc(100vh-120px)] max-w-2xl flex-col gap-0">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-t-2xl border border-b-0 border-slate-200 bg-white px-5 py-4">
        <Link
          to={`/posts/${meeting.postId}`}
          className="text-slate-400 hover:text-teal-600 transition-colors"
          title="Back to post"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-300 text-sm font-semibold text-white">
          {other?.name.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900">{other?.name ?? 'Unknown'}</div>
          <div className="truncate text-xs text-slate-500">
            {post?.title ?? 'Post'}
            {meeting.selectedSlot && (
              <> · <span className="text-teal-600">{meeting.selectedSlot}</span></>
            )}
          </div>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Active
        </span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto border border-b-0 border-slate-200 bg-slate-50 px-4 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="text-3xl">💬</div>
            <div className="text-sm font-medium text-slate-600">No messages yet</div>
            <div className="text-xs text-slate-400">
              Discuss the meeting venue, time, or project details here.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isMine = msg.fromUserId === u.id
              const sender = isMine ? u : other
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMine={isMine}
                  senderName={sender?.name ?? '?'}
                />
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="rounded-b-2xl border border-slate-200 bg-white px-4 py-3">
        {error && (
          <div className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 max-h-32"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Send"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 rotate-90">
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.903 6.308H10.5a.75.75 0 0 1 0 1.5H4.182l-1.903 6.308a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
          </button>
        </div>
        <div className="mt-1.5 text-right text-[11px] text-slate-400">
          {text.length > 0 && `${text.length}/2000`}
        </div>
      </div>
    </div>
  )
}
