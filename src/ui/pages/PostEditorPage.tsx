import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { db } from '../../lib/db'
import type {
  CollaborationType,
  ConfidentialityLevel,
  ExpertiseRequired,
  PostStatus,
  ProjectStage,
} from '../../lib/models'
import { createPost, updatePost } from '../../lib/posts'
import { dateOnlyIso } from '../../lib/utils'
import { Card, Button, Select, TextInput } from '../components/Ui'

const stageOptions: Array<{ value: ProjectStage; label: string }> = [
  { value: 'idea', label: 'Idea' },
  { value: 'concept_validation', label: 'Concept validation' },
  { value: 'prototype_developed', label: 'Prototype developed' },
  { value: 'pilot_testing', label: 'Pilot testing' },
  { value: 'pre_deployment', label: 'Pre-deployment' },
]

export function PostEditorPage(props: { mode: 'create' | 'edit' }) {
  const u = getCurrentUser()!
  const nav = useNavigate()
  const { postId } = useParams()
  const existing = useMemo(() => {
    if (props.mode !== 'edit') return null
    if (!postId) return null
    return db.get().posts.find((p) => p.id === postId) ?? null
  }, [postId, props.mode])

  const defaultExpiry = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return dateOnlyIso(d)
  }, [])

  const [title, setTitle] = useState(existing?.title ?? '')
  const [expertiseRequired, setExpertiseRequired] = useState<ExpertiseRequired>(existing?.expertiseRequired ?? (u.role === 'engineer' ? 'medical' : 'engineering'))
  const [workingDomain, setWorkingDomain] = useState(existing?.workingDomain ?? '')
  const [shortExplanation, setShortExplanation] = useState(existing?.shortExplanation ?? '')
  const [desiredExpertise, setDesiredExpertise] = useState(existing?.desiredExpertise ?? '')
  const [commitmentLevel, setCommitmentLevel] = useState(existing?.commitmentLevel ?? '')
  const [highLevelIdea, setHighLevelIdea] = useState(existing?.highLevelIdea ?? '')
  const [collaborationType, setCollaborationType] = useState<CollaborationType>(existing?.collaborationType ?? 'advisor')
  const [confidentialityLevel, setConfidentialityLevel] = useState<ConfidentialityLevel>(existing?.confidentialityLevel ?? 'meeting_only')
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate ?? defaultExpiry)
  const [autoClose, setAutoClose] = useState(existing?.autoClose ?? true)
  const [projectStage, setProjectStage] = useState<ProjectStage>(existing?.projectStage ?? 'idea')
  const [country, setCountry] = useState(existing?.country ?? '')
  const [city, setCity] = useState(existing?.city ?? '')
  const [status, setStatus] = useState<PostStatus>(existing?.status ?? 'active')

  const [error, setError] = useState<string | null>(null)

  if (props.mode === 'edit' && !existing) {
    return (
      <Card>
        <div className="text-sm text-slate-600">Post not found.</div>
      </Card>
    )
  }

  const canEdit = props.mode === 'create' || u.role === 'admin' || existing?.ownerUserId === u.id
  if (!canEdit) {
    return (
      <Card>
        <div className="text-sm text-slate-600">You can only edit your own posts.</div>
      </Card>
    )
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <Card className="p-6">
        <h1 className="text-xl font-semibold tracking-tight">{props.mode === 'create' ? 'Create announcement' : 'Edit announcement'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Keep it high-level. Do not include confidential technical material, IP files, or any patient data.
        </p>

        <form
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            try {
              if (!title.trim()) throw new Error('Title is required.')
              if (!workingDomain.trim()) throw new Error('Working domain is required.')
              if (!shortExplanation.trim()) throw new Error('Short explanation is required.')
              if (!desiredExpertise.trim()) throw new Error('Desired expertise is required.')
              if (!commitmentLevel.trim()) throw new Error('Commitment level is required.')
              if (!country.trim() || !city.trim()) throw new Error('Country and city are required.')

              if (props.mode === 'create') {
                const post = createPost({
                  userId: u.id,
                  role: u.role === 'admin' ? 'engineer' : u.role,
                  title,
                  expertiseRequired,
                  workingDomain,
                  shortExplanation,
                  desiredExpertise,
                  commitmentLevel,
                  highLevelIdea,
                  collaborationType,
                  confidentialityLevel,
                  expiryDate,
                  autoClose,
                  projectStage,
                  country,
                  city,
                  status,
                })
                nav(`/posts/${post.id}`)
              } else {
                updatePost(existing!.id, u.id, u.role, {
                  title,
                  expertiseRequired,
                  workingDomain,
                  shortExplanation,
                  desiredExpertise,
                  commitmentLevel,
                  highLevelIdea,
                  collaborationType,
                  confidentialityLevel,
                  expiryDate,
                  autoClose,
                  projectStage,
                  country,
                  city,
                  status,
                })
                nav(`/posts/${existing!.id}`)
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Save failed.')
            }
          }}
        >
          <TextInput label="Title" value={title} onChange={setTitle} placeholder="Short, clear, non-confidential title" />

          <Select
            label="Expertise required"
            value={expertiseRequired}
            onChange={(v) => setExpertiseRequired(v as ExpertiseRequired)}
            options={[
              { value: 'medical', label: 'Medical expertise' },
              { value: 'engineering', label: 'Engineering expertise' },
            ]}
          />

          <TextInput label="Working domain" value={workingDomain} onChange={setWorkingDomain} placeholder="e.g., cardiology imaging" />
          <TextInput label="Short explanation" value={shortExplanation} onChange={setShortExplanation} placeholder="1-2 sentences" />
          <TextInput label="Desired expertise" value={desiredExpertise} onChange={setDesiredExpertise} placeholder="Who are you looking for?" />
          <TextInput label="Commitment required" value={commitmentLevel} onChange={setCommitmentLevel} placeholder="e.g., 1 meeting + async feedback" />
          <TextInput
            label="High-level idea (no sensitive details)"
            value={highLevelIdea}
            onChange={setHighLevelIdea}
            placeholder="Optional"
            hint="Avoid detailed architecture, datasets, or confidential IP."
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Collaboration type"
              value={collaborationType}
              onChange={(v) => setCollaborationType(v as CollaborationType)}
              options={[
                { value: 'advisor', label: 'Advisor' },
                { value: 'co_founder', label: 'Co-founder' },
                { value: 'research_partner', label: 'Research partner' },
              ]}
            />
            <Select
              label="Confidentiality level"
              value={confidentialityLevel}
              onChange={(v) => setConfidentialityLevel(v as ConfidentialityLevel)}
              options={[
                { value: 'public_pitch', label: 'Public short pitch' },
                { value: 'meeting_only', label: 'Details discussed in meeting only' },
              ]}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-900">Expiry date</div>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-400"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                type="date"
              />
            </label>
            <Select
              label="Project stage"
              value={projectStage}
              onChange={(v) => setProjectStage(v as ProjectStage)}
              options={stageOptions}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Country" value={country} onChange={setCountry} placeholder="e.g., Turkey" />
            <TextInput label="City" value={city} onChange={setCity} placeholder="e.g., Ankara" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as PostStatus)}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
                { value: 'closed', label: 'Partner Found (Closed)' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <input checked={autoClose} onChange={(e) => setAutoClose(e.target.checked)} type="checkbox" />
              <span className="text-sm text-slate-700">Auto-close when partner found</span>
            </label>
          </div>

          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

          <div className="flex items-center justify-between gap-3">
            <Button type="submit">{props.mode === 'create' ? 'Publish' : 'Save changes'}</Button>
            <Button variant="secondary" onClick={() => nav(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

