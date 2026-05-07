import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { db } from '../../lib/db'
import type { MeetingRequest, Post, PostStatus } from '../../lib/models'
import { changePostStatus } from '../../lib/posts'
import { createMeetingRequest, updateMeetingRequest } from '../../lib/meetings'
import { audit } from '../../lib/audit'
import { nowIso, uid } from '../../lib/utils'
import { Alert, Avatar, Button, Card, Pill, SectionCard, Textarea, TextInput } from '../components/Ui'

function statusConfig(s: PostStatus): { label: string; tone: 'slate' | 'green' | 'amber' | 'rose' | 'blue' | 'teal' | 'violet'; dot: boolean } {
  if (s === 'active') return { label: 'Active', tone: 'green', dot: true }
  if (s === 'meeting_scheduled') return { label: 'Meeting Scheduled', tone: 'amber', dot: true }
  if (s === 'closed') return { label: 'Partner Found', tone: 'slate', dot: false }
  if (s === 'expired') return { label: 'Expired', tone: 'rose', dot: false }
  return { label: 'Draft', tone: 'slate', dot: false }
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
      <Card className="p-8 text-center">
        <div className="text-sm text-slate-500">Post not found.</div>
        <Link to="/posts" className="mt-4 inline-block text-sm text-teal-600 hover:underline">← Back to announcements</Link>
      </Card>
    )
  }

  const isOwner = u.role === 'admin' || post.ownerUserId === u.id
  const canMessage = !isOwner && post.status !== 'expired' && post.status !== 'closed'
  const myMeetings = meetingsForPost.filter((m) => m.fromUserId === u.id || m.toUserId === u.id)
  const allMeetings = isOwner ? meetingsForPost : myMeetings
  const sc = statusConfig(post.status)

  const stageLabel: Record<string, string> = {
    idea: 'Idea',
    concept_validation: 'Concept validation',
    prototype_developed: 'Prototype developed',
    pilot_testing: 'Pilot testing',
    pre_deployment: 'Pre-deployment',
  }

  return (
    <div className="grid gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/posts" className="hover:text-teal-600 transition-colors">Announcements</Link>
        <span>/</span>
        <span className="max-w-xs truncate text-slate-700 font-medium">{post.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{post.title}</h1>
            <Pill tone={sc.tone} dot={sc.dot}>{sc.label}</Pill>
            <Pill tone={post.expertiseRequired === 'medical' ? 'teal' : 'blue'}>
              {post.expertiseRequired === 'medical' ? 'Needs medical' : 'Needs engineering'}
            </Pill>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{post.workingDomain}</span>
            <span>·</span>
            <span>{post.city}, {post.country}</span>
            <span>·</span>
            <span>Expires {post.expiryDate}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => nav('/posts')}>← Back</Button>
          {isOwner && (
            <>
              <Link to={`/posts/${post.id}/edit`}>
                <Button variant="secondary" size="sm">Edit</Button>
              </Link>
              <Button
                variant={post.status === 'closed' ? 'ghost' : 'primary'}
                size="sm"
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
                {post.status === 'closed' ? '✓ Partner Found' : 'Mark Partner Found'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: post details */}
        <div className="grid gap-4 lg:col-span-2">
          <SectionCard title="Announcement details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Working domain" value={post.workingDomain} />
              <Field label="Project stage" value={stageLabel[post.projectStage] ?? post.projectStage} />
              <Field label="Collaboration type" value={post.collaborationType.replaceAll('_', ' ')} />
              <Field label="Commitment required" value={post.commitmentLevel} />
              <Field
                label="Confidentiality"
                value={post.confidentialityLevel === 'meeting_only' ? 'Details discussed in meeting only' : 'Public short pitch'}
              />
              <Field label="Location" value={`${post.city}, ${post.country}`} />
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Short explanation</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{post.shortExplanation}</p>
            </div>

            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Desired expertise</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{post.desiredExpertise}</p>
            </div>

            {post.highLevelIdea && (
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">High-level idea</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{post.highLevelIdea}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3" aria-hidden="true">
                    <rect x="2" y="4" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  Confidential details will only be discussed in the meeting
                </div>
              </div>
            )}
          </SectionCard>

          {/* Status lifecycle */}
          {post.lifecycle.length > 1 && (
            <SectionCard title="Lifecycle">
              <div className="grid gap-2">
                {post.lifecycle.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                    <span className="text-slate-500 tabular-nums">{e.at.slice(0, 10)}</span>
                    <span className="text-slate-700 capitalize font-medium">{e.to.replaceAll('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Meeting request form */}
          {canMessage && (
            <SectionCard title="Express interest" description="Send a short message and propose meeting time slots.">
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <strong>Important:</strong> Meetings happen externally via Zoom or Teams. No recordings are stored on this platform.
              </div>

              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  setError(null)
                  try {
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
                    nav(0)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to send request.')
                  }
                }}
              >
                <Textarea
                  label="Short message (optional)"
                  value={interestMsg}
                  onChange={setInterestMsg}
                  placeholder="Hi, I'm interested. I can help with…"
                  rows={2}
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextInput label="Proposed slot 1" value={slot1} onChange={setSlot1} placeholder="e.g., 2026-05-10 14:00" />
                  <TextInput label="Proposed slot 2" value={slot2} onChange={setSlot2} placeholder="e.g., 2026-05-11 10:30" />
                  <TextInput label="Proposed slot 3" value={slot3} onChange={setSlot3} placeholder="e.g., 2026-05-12 16:00" />
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:border-teal-300 transition-colors">
                  <input
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 accent-teal-600"
                    checked={ndaAccepted}
                    onChange={(e) => setNdaAccepted(e.target.checked)}
                    type="checkbox"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-800">I accept the NDA for first-contact meeting</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      I understand that confidential details should only be discussed in the scheduled meeting. I will not share any disclosed information with third parties.
                    </div>
                  </div>
                </label>

                {error && <Alert tone="error">{error}</Alert>}

                <div className="flex justify-end">
                  <Button type="submit">Send meeting request</Button>
                </div>
              </form>
            </SectionCard>
          )}

          {/* My meetings */}
          {allMeetings.length > 0 && (
            <SectionCard title="Meeting requests" description="Proposed time slots, accept/decline, or cancel.">
              <div className="grid gap-3">
                {allMeetings.map((m) => (
                  <MeetingCard key={m.id} meeting={m} post={post} isOwner={isOwner} onChanged={() => nav(0)} />
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="grid gap-4">
          {/* Posted by */}
          <Card className="p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Posted by</div>
            <div className="flex items-center gap-3">
              <Avatar name={owner.name} role={owner.role} size="md" />
              <div>
                <div className="font-semibold text-slate-900">{owner.name}</div>
                <div className="text-xs text-slate-500 capitalize mt-0.5">{db.roleLabel(owner.role)}</div>
                {owner.verified && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                    <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" aria-hidden="true">
                      <circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.15"/>
                      <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Verified
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Status info */}
          <Card className="p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Status</div>
            <div className="grid gap-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Current</span>
                <Pill tone={sc.tone} dot={sc.dot}>{sc.label}</Pill>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Confidentiality</span>
                <span className="text-xs font-medium text-slate-700">
                  {post.confidentialityLevel === 'meeting_only' ? 'Meeting only' : 'Public pitch'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Auto-close</span>
                <span className="text-xs font-medium text-slate-700">{post.autoClose ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Expires</span>
                <span className="text-xs font-medium text-slate-700">{post.expiryDate}</span>
              </div>
            </div>
          </Card>

          {/* Platform notice */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-600 mb-1">Platform policy</div>
            <ul className="grid gap-1">
              {[
                'No file uploads allowed',
                'No patient data stored',
                'Meetings happen externally',
                'NDA required for contact',
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true">
                    <path d="M2 6l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field(props: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{props.label}</div>
      <div className="mt-1 text-sm text-slate-800 capitalize">{props.value}</div>
    </div>
  )
}

function MeetingCard(props: { meeting: MeetingRequest; post: Post; isOwner: boolean; onChanged: () => void }) {
  const u = getCurrentUser()!
  const m = props.meeting
  const otherUserId = m.fromUserId === u.id ? m.toUserId : m.fromUserId
  const other = db.get().users.find((x) => x.id === otherUserId)

  const canAcceptDecline = props.isOwner && m.toUserId === u.id && m.status === 'pending'
  const canCancel = m.fromUserId === u.id && m.status === 'pending'

  const statusCls =
    m.status === 'accepted'
      ? 'bg-emerald-50 text-emerald-700'
      : m.status === 'declined'
        ? 'bg-rose-50 text-rose-700'
        : m.status === 'cancelled'
          ? 'bg-slate-100 text-slate-500'
          : 'bg-amber-50 text-amber-700'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={other?.name ?? '?'} role={other?.role} size="sm" />
          <div>
            <div className="text-sm font-semibold text-slate-800">{other?.name ?? 'Unknown'}</div>
            <span className={`mt-0.5 inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${statusCls}`}>
              {m.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Chat butonu — yalnızca accepted meeting'lerde */}
          {m.status === 'accepted' && (
            <Link to={`/chat/${m.id}`}>
              <Button
                size="sm"
                variant="outline"
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M3.505 2.365A41.369 41.369 0 0 1 9 2c1.863 0 3.697.124 5.495.365 1.247.167 2.318 1.108 2.47 2.456A49.954 49.954 0 0 1 17 8c0 1.106-.07 2.194-.208 3.264-.132 1.084-.96 1.948-1.97 2.188a49.913 49.913 0 0 1-3.822.515c.18.8.314 1.617.398 2.45a.5.5 0 0 1-.496.583H11a.5.5 0 0 1-.5-.5v-.011a38.47 38.47 0 0 0-.512-4.57C6.687 11.64 4 10.044 4 8V6.528A41.454 41.454 0 0 1 3.505 2.365Z" />
                  </svg>
                }
              >
                Sohbet
              </Button>
            </Link>
          )}
          {canAcceptDecline && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  const selected = m.proposedSlots[0]
                  updateMeetingRequest({ meetingId: m.id, actingUserId: u.id, status: 'accepted', selectedSlot: selected })
                  changePostStatus(props.post.id, u.id, u.role, 'meeting_scheduled')
                  props.onChanged()
                }}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  updateMeetingRequest({ meetingId: m.id, actingUserId: u.id, status: 'declined' })
                  props.onChanged()
                }}
              >
                Decline
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                updateMeetingRequest({ meetingId: m.id, actingUserId: u.id, status: 'cancelled' })
                props.onChanged()
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="text-xs text-slate-500 mb-1.5">Proposed time slots</div>
        <div className="flex flex-wrap gap-2">
          {m.proposedSlots.map((s) => (
            <span
              key={s}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium tabular-nums ${
                m.selectedSlot === s ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' : 'bg-slate-50 text-slate-600'
              }`}
            >
              {s}
              {m.selectedSlot === s && ' ✓'}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
