import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { db } from '../../lib/db'
import { getMessages } from '../../lib/chat'
import { Card } from '../components/Ui'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function ChatsListPage() {
  const u = getCurrentUser()!
  const data = db.get()

  const chats = useMemo(() => {
    const acceptedMeetings = data.meetings.filter(
      (m) => m.status === 'accepted' && (m.fromUserId === u.id || m.toUserId === u.id),
    )

    return acceptedMeetings.map((meeting) => {
      const otherUserId = meeting.fromUserId === u.id ? meeting.toUserId : meeting.fromUserId
      const other = data.users.find((x) => x.id === otherUserId)
      const post = data.posts.find((p) => p.id === meeting.postId)
      const messages = getMessages(meeting.id)
      const lastMsg = messages.at(-1)
      return { meeting, other, post, lastMsg, messageCount: messages.length }
    }).sort((a, b) => {
      const aTime = a.lastMsg?.createdAt ?? a.meeting.updatedAt
      const bTime = b.lastMsg?.createdAt ?? b.meeting.updatedAt
      return aTime < bTime ? 1 : -1
    })
  }, [data, u.id])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Chats</h1>
        <p className="mt-1 text-sm text-slate-500">
          Private messages from your accepted meeting requests.
        </p>
      </div>

      {chats.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="text-4xl">💬</div>
          <div className="font-medium text-slate-700">No active chats yet</div>
          <p className="text-sm text-slate-400">
            Send a meeting request on an announcement — once accepted, a chat will appear here.
          </p>
          <Link
            to="/posts"
            className="mt-1 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
          >
            Browse announcements
          </Link>
        </Card>
      ) : (
        <div className="grid gap-2">
          {chats.map(({ meeting, other, post, lastMsg, messageCount }) => (
            <Link key={meeting.id} to={`/chat/${meeting.id}`}>
              <Card hoverable className="flex items-center gap-4 p-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-base font-bold text-white shadow-sm">
                    {other?.name.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-slate-900">
                      {other?.name ?? 'Unknown'}
                    </span>
                    {lastMsg && (
                      <span className="shrink-0 text-xs text-slate-400">{timeAgo(lastMsg.createdAt)}</span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {post?.title ?? 'Post'}
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-600">
                    {lastMsg ? (
                      <>
                        {lastMsg.fromUserId === u.id && (
                          <span className="text-slate-400">You: </span>
                        )}
                        {lastMsg.text}
                      </>
                    ) : (
                      <span className="italic text-slate-400">No messages yet — start the conversation!</span>
                    )}
                  </div>
                </div>

                {/* Message count badge */}
                {messageCount > 0 && (
                  <div className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {messageCount}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
