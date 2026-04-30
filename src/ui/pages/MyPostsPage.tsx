import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { db } from '../../lib/db'
import { changePostStatus } from '../../lib/posts'
import type { Post, PostStatus, MeetingRequest } from '../../lib/models'
import { Avatar, Button, Card, EmptyState, Pill, StatCard } from '../components/Ui'

function statusConfig(s: PostStatus): { label: string; tone: 'slate' | 'green' | 'amber' | 'rose' | 'blue' | 'teal' | 'violet'; dot: boolean } {
  if (s === 'active') return { label: 'Active', tone: 'green', dot: true }
  if (s === 'meeting_scheduled') return { label: 'Meeting Scheduled', tone: 'amber', dot: true }
  if (s === 'closed') return { label: 'Partner Found', tone: 'slate', dot: false }
  if (s === 'expired') return { label: 'Expired', tone: 'rose', dot: false }
  return { label: 'Draft', tone: 'slate', dot: false }
}

export function MyPostsPage() {
  const u = getCurrentUser()!
  const nav = useNavigate()

  const { myPosts, incomingMeetings, outgoingMeetings } = useMemo(() => {
    const data = db.get()
    const myPosts = data.posts
      .filter((p) => p.ownerUserId === u.id)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

    const incomingMeetings = data.meetings.filter(
      (m) => m.toUserId === u.id && m.status === 'pending',
    )
    const outgoingMeetings = data.meetings.filter(
      (m) => m.fromUserId === u.id && m.status === 'pending',
    )

    return { myPosts, incomingMeetings, outgoingMeetings }
  }, [u.id])

  const activePosts = myPosts.filter((p) => p.status === 'active').length
  const closedPosts = myPosts.filter((p) => p.status === 'closed').length

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your posts and respond to meeting requests.</p>
        </div>
        <Link to="/posts/new">
          <Button>+ New announcement</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="My posts" value={myPosts.length} tone="teal"
          icon={<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true"><rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8h8M6 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
        />
        <StatCard label="Active" value={activePosts} tone="blue"
          icon={<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
        />
        <StatCard label="Incoming requests" value={incomingMeetings.length} tone="amber"
          icon={<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M3 10l7-7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 3v12M5 15h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
        />
        <StatCard label="Partners matched" value={closedPosts} tone="violet"
          icon={<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M7 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/></svg>}
        />
      </div>

      {/* Incoming meeting requests */}
      {incomingMeetings.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Pending meeting requests
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
              {incomingMeetings.length}
            </span>
          </h2>
          <div className="grid gap-3">
            {incomingMeetings.map((m) => (
              <MeetingRequestCard key={m.id} meeting={m} type="incoming" />
            ))}
          </div>
        </section>
      )}

      {/* Outgoing meeting requests */}
      {outgoingMeetings.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            My sent requests
          </h2>
          <div className="grid gap-3">
            {outgoingMeetings.map((m) => (
              <MeetingRequestCard key={m.id} meeting={m} type="outgoing" />
            ))}
          </div>
        </section>
      )}

      {/* My posts */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">All my posts</h2>
        {myPosts.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={
                <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12" aria-hidden="true">
                  <rect x="8" y="10" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 24h16M16 30h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M24 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              }
              title="No announcements yet"
              description="Create your first announcement to start finding collaborators."
              action={
                <Link to="/posts/new">
                  <Button>Create announcement</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3">
            {myPosts.map((p) => (
              <MyPostCard key={p.id} post={p} onChanged={() => nav(0)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MyPostCard(props: { post: Post; onChanged: () => void }) {
  const p = props.post
  const u = getCurrentUser()!
  const sc = statusConfig(p.status)

  const meetingCount = db.get().meetings.filter((m) => m.postId === p.id).length
  const pendingCount = db.get().meetings.filter((m) => m.postId === p.id && m.status === 'pending').length

  const leftBarColor =
    p.status === 'active'
      ? 'bg-gradient-to-b from-teal-500 to-emerald-500'
      : p.status === 'meeting_scheduled'
        ? 'bg-gradient-to-b from-amber-400 to-orange-400'
        : p.status === 'expired'
          ? 'bg-slate-200'
          : 'bg-gradient-to-b from-slate-300 to-slate-400'

  return (
    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`w-1 shrink-0 ${leftBarColor}`} />
      <div className="flex flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 truncate">{p.title}</h3>
            <Pill tone={sc.tone} dot={sc.dot}>{sc.label}</Pill>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {pendingCount} pending request{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{p.workingDomain}</span>
            <span>·</span>
            <span>{p.city}, {p.country}</span>
            <span>·</span>
            <span>Expires {p.expiryDate}</span>
            <span>·</span>
            <span>{meetingCount} meeting request{meetingCount !== 1 ? 's' : ''}</span>
          </div>
          <p className="mt-2 line-clamp-1 text-sm text-slate-600">{p.shortExplanation}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link to={`/posts/${p.id}`}>
            <Button variant="secondary" size="sm">View</Button>
          </Link>
          <Link to={`/posts/${p.id}/edit`}>
            <Button variant="ghost" size="sm">Edit</Button>
          </Link>
          {p.status !== 'closed' && p.status !== 'expired' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Mark this post as "Partner Found" and close it?')) {
                  changePostStatus(p.id, u.id, u.role, 'closed')
                  props.onChanged()
                }
              }}
            >
              Mark Found
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function MeetingRequestCard(props: { meeting: MeetingRequest; type: 'incoming' | 'outgoing' }) {
  const m = props.meeting
  const data = db.get()

  const otherUserId = props.type === 'incoming' ? m.fromUserId : m.toUserId
  const other = data.users.find((x) => x.id === otherUserId)
  const post = data.posts.find((p) => p.id === m.postId)

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <Avatar name={other?.name ?? '?'} role={other?.role} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{other?.name ?? 'Unknown'}</span>
          <span className="text-xs text-slate-400">
            {props.type === 'incoming' ? '→ your post' : '← your request'}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-slate-600 truncate">
          Re: {post?.title ?? 'Unknown post'}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {m.proposedSlots.slice(0, 3).map((s) => (
            <span key={s} className="rounded bg-white px-2 py-0.5 text-xs font-mono text-slate-600 border border-slate-200">{s}</span>
          ))}
        </div>
      </div>
      <Link to={`/posts/${m.postId}`}>
        <Button variant="secondary" size="sm">View →</Button>
      </Link>
    </div>
  )
}
