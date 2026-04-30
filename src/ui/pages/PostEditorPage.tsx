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
import { Alert, Button, Card, FormSection, Select, Textarea, TextInput } from '../components/Ui'

const stageOptions: Array<{ value: ProjectStage; label: string }> = [
  { value: 'idea', label: 'Idea — very early stage' },
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
    return <Card className="p-8 text-center text-sm text-slate-500">Post not found.</Card>
  }
  const canEdit = props.mode === 'create' || u.role === 'admin' || existing?.ownerUserId === u.id
  if (!canEdit) {
    return <Card className="p-8 text-center text-sm text-slate-500">You can only edit your own posts.</Card>
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <button onClick={() => nav(-1)} className="hover:text-teal-600 transition-colors">← Back</button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {props.mode === 'create' ? 'Create announcement' : 'Edit announcement'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Keep everything high-level. Never include confidential IP, technical docs, or patient data.
        </p>
      </div>

      {/* Warning */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" aria-hidden="true">
          <path d="M10 2L2 17h16L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M10 9v3M10 14.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <div className="text-sm text-amber-800">
          <strong>Important:</strong> Do not upload documents, share datasets, or include any patient information.
          This platform is for first-contact only. Sensitive details should be discussed in the meeting.
        </div>
      </div>

      <form
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
                title, expertiseRequired, workingDomain, shortExplanation,
                desiredExpertise, commitmentLevel, highLevelIdea, collaborationType,
                confidentialityLevel, expiryDate, autoClose, projectStage, country, city, status,
              })
              nav(`/posts/${post.id}`)
            } else {
              updatePost(existing!.id, u.id, u.role, {
                title, expertiseRequired, workingDomain, shortExplanation,
                desiredExpertise, commitmentLevel, highLevelIdea, collaborationType,
                confidentialityLevel, expiryDate, autoClose, projectStage, country, city, status,
              })
              nav(`/posts/${existing!.id}`)
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed.')
          }
        }}
      >
        <Card className="p-6 grid gap-6">
          {/* Section 1: Basic info */}
          <FormSection title="Basic information" description="What this announcement is about.">
            <TextInput label="Title" value={title} onChange={setTitle} placeholder="Short, clear, non-confidential title" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Expertise required"
                value={expertiseRequired}
                onChange={(v) => setExpertiseRequired(v as ExpertiseRequired)}
                options={[
                  { value: 'medical', label: 'Medical expertise (for engineers)' },
                  { value: 'engineering', label: 'Engineering expertise (for doctors)' },
                ]}
                required
              />
              <TextInput label="Working domain" value={workingDomain} onChange={setWorkingDomain} placeholder="e.g., Cardiology imaging" required />
            </div>
          </FormSection>

          {/* Section 2: Details */}
          <FormSection title="Project details" description="Explain your project at a high level.">
            <Textarea
              label="Short explanation"
              value={shortExplanation}
              onChange={setShortExplanation}
              placeholder="1–2 sentences describing what you are working on."
              rows={3}
              required
            />
            <TextInput
              label="Desired expertise"
              value={desiredExpertise}
              onChange={setDesiredExpertise}
              placeholder="Who are you looking for? E.g., cardiologist familiar with imaging workflow"
              required
            />
            <TextInput
              label="Commitment required"
              value={commitmentLevel}
              onChange={setCommitmentLevel}
              placeholder="E.g., 1 meeting + async Q&A, or 2–3 weeks part-time"
              required
            />
            <Textarea
              label="High-level idea"
              value={highLevelIdea}
              onChange={setHighLevelIdea}
              placeholder="Optional. Describe the concept at a high level — no sensitive details, datasets, or IP."
              rows={2}
              hint="⚠ Avoid detailed architecture, specific datasets, or confidential intellectual property."
            />
          </FormSection>

          {/* Section 3: Collaboration & confidentiality */}
          <FormSection title="Collaboration settings" description="How you'd like to work together.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Collaboration type"
                value={collaborationType}
                onChange={(v) => setCollaborationType(v as CollaborationType)}
                options={[
                  { value: 'advisor', label: 'Advisor — guidance & feedback' },
                  { value: 'co_founder', label: 'Co-founder — build together' },
                  { value: 'research_partner', label: 'Research partner' },
                ]}
              />
              <Select
                label="Confidentiality level"
                value={confidentialityLevel}
                onChange={(v) => setConfidentialityLevel(v as ConfidentialityLevel)}
                options={[
                  { value: 'meeting_only', label: 'Details discussed in meeting only' },
                  { value: 'public_pitch', label: 'Public short pitch' },
                ]}
              />
            </div>
          </FormSection>

          {/* Section 4: Logistics */}
          <FormSection title="Logistics" description="Stage, location, expiry, and status.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Project stage"
                value={projectStage}
                onChange={(v) => setProjectStage(v as ProjectStage)}
                options={stageOptions}
              />
              <Select
                label="Status"
                value={status}
                onChange={(v) => setStatus(v as PostStatus)}
                options={[
                  { value: 'draft', label: 'Draft — not visible to others' },
                  { value: 'active', label: 'Active — visible and open' },
                  { value: 'closed', label: 'Closed — partner found' },
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Country" value={country} onChange={setCountry} placeholder="e.g., Turkey" required />
              <TextInput label="City" value={city} onChange={setCity} placeholder="e.g., Ankara" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <div className="mb-1.5 text-sm font-medium text-slate-700">Expiry date</div>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  type="date"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 mt-auto hover:border-teal-300 transition-colors">
                <input
                  checked={autoClose}
                  onChange={(e) => setAutoClose(e.target.checked)}
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-teal-600"
                />
                <div>
                  <div className="text-sm font-medium text-slate-800">Auto-close when partner found</div>
                  <div className="text-xs text-slate-500">Status changes to Closed automatically</div>
                </div>
              </label>
            </div>
          </FormSection>

          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <Button type="submit" size="lg">
              {props.mode === 'create' ? 'Publish announcement' : 'Save changes'}
            </Button>
            <Button variant="secondary" onClick={() => nav(-1)}>Cancel</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
