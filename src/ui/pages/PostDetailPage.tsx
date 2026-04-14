import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { db } from '../../lib/db'
import type { MeetingRequest, Post, PostStatus } from '../../lib/models'
import { changePostStatus } from '../../lib/posts'
import { createMeetingRequest, updateMeetingRequest } from '../../lib/meetings'
import { audit } from '../../lib/audit'
import { nowIso, uid } from '../../lib/utils'
import { Card, Button, Pill, TextInput } from '../components/Ui'

function statusTone(s: PostStatus): 'slate' | 'green' | 'amber' | 'rose' {
  if (s === 'active') return 'green'
  if (s === 'meeting_scheduled') return 'amber'
  if (s === 'closed') return 'slate'
  if (s === 'expired') return 'rose'
  return 'slate'
}

export function PostDetailPage() {
  const u = getCurrentUser()!
  const nav = useNavigate()
  const { postId } = useParams()

  const { post, owner, meetingsForPost } = useMemo(() => {
    const data = db.get()
    const post = data.posts.find((p) => p.id === postId) ?? null
    const owner = post ? data.users.find((x) => x.id === post.ownerUserId) ?? null : null
    const meetingsForPost = post ? data.meetings.filter((m) => m.postId === post.id) : []
    return { post, owner, meetingsForPost }
  }, [postId])

  const [interestMsg, setInterestMsg] = useState('')
  const [ndaAccepted, setNdaAccepted] = useState(false)
  const [slot1, setSlot1] = useState('')
  const [slot2, setSlot2] = useState('')
  const [slot3, setSlot3] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!post || !owner) {
    return (
      <Card>
        <div className="text-sm text-slate-600">Post not found.</div>
      </Card>
    )
  }

  const isOwner = u.role === 'admin' || post.ownerUserId === u.id
  const canMessage = !isOwner && post.status !== 'expired' && post.status !== 'closed'

  const myMeetings = meetingsForPost.filter((m) => m.fromUserId === u.id || m.toUserId === u.id)

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{post.title}</h1>
            <Pill tone={statusTone(post.status)}>{post.status.replaceAll('_', ' ')}</Pill>
            <Pill>{post.expertiseRequired === 'medical' ? 'Needs medical' : 'Needs engineering'}</Pill>
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {post.workingDomain} • {post.city}, {post.country} • Expires {post.expiryDate}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => nav('/posts')}>
            Back
          </Button>
          {isOwner ? (
            <>
              <Link to={`/posts/${post.id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button
                variant="primary"
                disabled={post.status === 'closed'}
                onClick={() => {
                  try {
                    changePostStatus(post.id, u.id, u.role, 'closed')
                    nav(0)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed.')
                  }
                }}
              >
                Mark Partner Found
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs text-slate-500">Posted by</div>
            <div className="text-sm font-medium">{owner.name}</div>
            <div className="mt-2 text-xs text-slate-500">Confidentiality</div>
            <div className="text-sm text-slate-700">
              {post.confidentialityLevel === 'meeting_only' ? 'Details discussed in meeting only' : 'Public short pitch'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Stage</div>
            <div className="text-sm text-slate-700">{post.projectStage.replaceAll('_', ' ')}</div>
            <div className="mt-2 text-xs text-slate-500">Collaboration type</div>
            <div className="text-sm text-slate-700">{post.collaborationType.replaceAll('_', ' ')}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-slate-500">Short explanation</div>
          <div className="mt-1 text-sm text-slate-800">{post.shortExplanation}</div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-slate-500">Desired expertise</div>
          <div className="mt-1 text-sm text-slate-800">{post.desiredExpertise}</div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-slate-500">Commitment</div>
          <div className="mt-1 text-sm text-slate-800">{post.commitmentLevel}</div>
        </div>
        {post.highLevelIdea ? (
          <div className="mt-3">
            <div className="text-xs text-slate-500">High-level idea</div>
            <div className="mt-1 text-sm text-slate-800">{post.highLevelIdea}</div>
          </div>
        ) : null}
      </Card>

      {canMessage ? (
        <Card className="p-5">
          <div className="text-sm font-semibold">Express interest</div>
          <p className="mt-1 text-sm text-slate-600">
            Send a short message and propose meeting time slots. Meetings happen externally (Zoom/Teams). No recordings stored.
          </p>

          <form
            className="mt-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              try {
                // Interest message (lightweight)
                if (interestMsg.trim()) {
                  db.update((d) => {
                    d.interests.unshift({
                      id: uid('int'),
                      postId: post.id,
                      fromUserId: u.id,
                      toUserId: post.ownerUserId,
                      message: interestMsg.trim(),
                      createdAt: nowIso(),
                    })
                  })
                  audit({ userId: u.id, role: u.role, actionType: 'security_event', result: 'success', details: 'interest_message_sent' })
                }

                const slots = [slot1, slot2, slot3].map((s) => s.trim()).filter(Boolean)
                createMeetingRequest({
                  postId: post.id,
                  fromUserId: u.id,
                  toUserId: post.ownerUserId,
                  ndaAccepted,
                  proposedSlots: slots,
                })
                // In real workflow, owner acknowledges and parties agree; we mark the post as "meeting_scheduled" only on acceptance.
                nav(0)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to send request.')
              }
            }}
          >
            <TextInput label="Short message (optional)" value={interestMsg} onChange={setInterestMsg} placeholder="Hi, I’m interested. I can help with…" />
            <div className="grid gap-3 md:grid-cols-3">
              <TextInput label="Proposed slot 1" value={slot1} onChange={setSlot1} placeholder="2026-04-20 14:00" />
              <TextInput label="Proposed slot 2" value={slot2} onChange={setSlot2} placeholder="2026-04-21 10:30" />
              <TextInput label="Proposed slot 3" value={slot3} onChange={setSlot3} placeholder="2026-04-22 16:00" />
            </div>
            <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <input className="mt-1" checked={ndaAccepted} onChange={(e) => setNdaAccepted(e.target.checked)} type="checkbox" />
              <span className="text-sm text-slate-700">
                I accept the NDA for first-contact meeting. I understand that confidential details should only be discussed in the meeting.
              </span>
            </label>

            <div className="flex items-center justify-end">
              <Button type="submit">Send meeting request</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="p-5">
        <div className="text-sm font-semibold">Meeting requests</div>
        <p className="mt-1 text-sm text-slate-600">
          Propose slots, accept/decline, cancel. When accepted, the post becomes “Meeting Scheduled”.
        </p>

        <div className="mt-4 grid gap-3">
          {myMeetings.length === 0 ? (
            <div className="text-sm text-slate-600">No meeting requests involving you yet.</div>
          ) : (
            myMeetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                post={post}
                isOwner={isOwner}
                onChanged={() => nav(0)}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

function MeetingCard(props: { meeting: MeetingRequest; post: Post; isOwner: boolean; onChanged: () => void }) {
  const u = getCurrentUser()!
  const m = props.meeting
  const otherUserId = m.fromUserId === u.id ? m.toUserId : m.fromUserId
  const other = db.get().users.find((x) => x.id === otherUserId)

  const canAcceptDecline = props.isOwner && m.toUserId === u.id && m.status === 'pending'
  const canCancel = m.status === 'pending'

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm font-medium">With: {other?.name ?? 'Unknown'}</div>
          <div className="mt-1 text-xs text-slate-500">Status: {m.status}</div>
          <div className="mt-2 text-xs text-slate-500">Proposed slots</div>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            {m.proposedSlots.map((s) => (
              <li key={s}>
                {s}
                {m.selectedSlot === s ? <span className="ml-2 text-xs text-emerald-700">(selected)</span> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canAcceptDecline ? (
            <>
              <Button
                onClick={() => {
                  // owner selects first slot for demo simplicity
                  const selected = m.proposedSlots[0]
                  updateMeetingRequest({ meetingId: m.id, actingUserId: u.id, status: 'accepted', selectedSlot: selected })
                  changePostStatus(props.post.id, u.id, u.role, 'meeting_scheduled')
                  props.onChanged()
                }}
              >
                Accept (pick first slot)
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  updateMeetingRequest({ meetingId: m.id, actingUserId: u.id, status: 'declined' })
                  props.onChanged()
                }}
              >
                Decline
              </Button>
            </>
          ) : null}
          {canCancel ? (
            <Button
              variant="danger"
              onClick={() => {
                updateMeetingRequest({ meetingId: m.id, actingUserId: u.id, status: 'cancelled' })
                props.onChanged()
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

