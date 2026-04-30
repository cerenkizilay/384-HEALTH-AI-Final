import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { db } from '../../lib/db'
import type { Post, PostStatus, ProjectStage } from '../../lib/models'
import { Avatar, Button, Card, EmptyState, Pill, Select, TextInput } from '../components/Ui'

const stageLabels: Record<ProjectStage, string> = {
  idea: 'Idea',
  concept_validation: 'Concept validation',
  prototype_developed: 'Prototype developed',
  pilot_testing: 'Pilot testing',
  pre_deployment: 'Pre-deployment',
}

function statusConfig(s: PostStatus): { label: string; tone: 'slate' | 'green' | 'amber' | 'rose' | 'blue' | 'teal' | 'violet'; dot: boolean } {
  if (s === 'active') return { label: 'Active', tone: 'green', dot: true }
  if (s === 'meeting_scheduled') return { label: 'Meeting Scheduled', tone: 'amber', dot: true }
  if (s === 'closed') return { label: 'Partner Found', tone: 'slate', dot: false }
  if (s === 'expired') return { label: 'Expired', tone: 'rose', dot: false }
  return { label: 'Draft', tone: 'slate', dot: false }
}

export function PostsPage() {
  const u = getCurrentUser()!
  const data = db.get()

  const [q, setQ] = useState('')
  const [domain, setDomain] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [stage, setStage] = useState<ProjectStage | ''>('')
  const [status, setStatus] = useState<PostStatus | ''>('active')
  const [filtersOpen, setFiltersOpen] = useState(true)

  const posts = useMemo(() => {
    const query = q.trim().toLowerCase()
    return data.posts
      .filter((p) => {
        if (status && p.status !== status) return false
        if (domain && !p.workingDomain.toLowerCase().includes(domain.trim().toLowerCase())) return false
        if (city && p.city.toLowerCase() !== city.trim().toLowerCase()) return false
        if (country && p.country.toLowerCase() !== country.trim().toLowerCase()) return false
        if (stage && p.projectStage !== stage) return false
        if (!query) return true
        const hay = `${p.title} ${p.workingDomain} ${p.shortExplanation} ${p.desiredExpertise} ${p.city} ${p.country}`.toLowerCase()
        return hay.includes(query)
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  }, [q, domain, city, country, stage, status, data.posts])

  const cityMatches = useMemo(() => {
    if (!city) return new Set<string>()
    return new Set(posts.filter((p) => p.city.toLowerCase() === city.trim().toLowerCase()).map((p) => p.id))
  }, [posts, city])

  const hasFilters = !!(q || domain || city || country || stage)

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">
            {posts.length} result{posts.length !== 1 ? 's' : ''} · Filter by domain, location, stage, or status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFiltersOpen((x) => !x)}
            icon={
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
          >
            {filtersOpen ? 'Hide filters' : 'Show filters'}
          </Button>
          <Link to="/posts/new">
            <Button size="sm">+ New announcement</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-800">Filters</span>
            {hasFilters && (
              <button
                className="text-xs text-teal-600 hover:underline"
                onClick={() => { setQ(''); setDomain(''); setCity(''); setCountry(''); setStage('') }}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <TextInput label="Search" value={q} onChange={setQ} placeholder="Keyword…" />
            <TextInput label="Domain contains" value={domain} onChange={setDomain} placeholder="e.g., cardiology imaging" />
            <TextInput
              label="City (exact)"
              value={city}
              onChange={setCity}
              placeholder="e.g., Ankara"
              hint="City matches are highlighted in the list."
            />
            <TextInput label="Country (exact)" value={country} onChange={setCountry} placeholder="e.g., Turkey" />
            <Select
              label="Project stage"
              value={stage}
              onChange={(v) => setStage(v as ProjectStage | '')}
              options={[
                { value: '', label: 'Any stage' },
                ...Object.entries(stageLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as PostStatus | '')}
              options={[
                { value: '', label: 'Any status' },
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
                { value: 'closed', label: 'Partner Found (Closed)' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
          </div>
          {city && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              City highlighting active — posts in <strong className="mx-1">{city}</strong> are highlighted with a border.
            </div>
          )}
        </Card>
      )}

      {/* Results */}
      <div className="grid gap-3">
        {posts.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={
                <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12" aria-hidden="true">
                  <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 20h20M14 26h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              }
              title="No announcements match your filters"
              description="Try broadening your search or clearing some filters."
              action={
                hasFilters ? (
                  <Button variant="secondary" size="sm" onClick={() => { setQ(''); setDomain(''); setCity(''); setCountry(''); setStage('') }}>
                    Clear filters
                  </Button>
                ) : (
                  <Link to="/posts/new">
                    <Button size="sm">Create first announcement</Button>
                  </Link>
                )
              }
            />
          </Card>
        ) : (
          posts.map((p) => (
            <PostCard key={p.id} post={p} cityHighlight={city ? cityMatches.has(p.id) : false} currentUserId={u.id} />
          ))
        )}
      </div>
    </div>
  )
}

function PostCard(props: { post: Post; cityHighlight: boolean; currentUserId: string }) {
  const p = props.post
  const owner = db.get().users.find((u) => u.id === p.ownerUserId)
  const sc = statusConfig(p.status)

  const stageLabelShort: Record<ProjectStage, string> = {
    idea: 'Idea',
    concept_validation: 'Concept',
    prototype_developed: 'Prototype',
    pilot_testing: 'Pilot',
    pre_deployment: 'Pre-deploy',
  }

  const leftBarColor =
    p.status === 'active'
      ? 'bg-gradient-to-b from-teal-500 to-emerald-500'
      : p.status === 'meeting_scheduled'
        ? 'bg-gradient-to-b from-amber-400 to-orange-400'
        : p.status === 'expired'
          ? 'bg-slate-200'
          : 'bg-gradient-to-b from-slate-300 to-slate-400'

  return (
    <Link to={`/posts/${p.id}`} className="group block">
      <div
        className={`relative flex overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-150 group-hover:shadow-md group-hover:-translate-y-0.5 ${
          props.cityHighlight ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200 group-hover:border-teal-200'
        }`}
      >
        {/* Status bar */}
        <div className={`w-1 shrink-0 ${leftBarColor}`} />

        <div className="flex flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                {p.title}
              </h3>
              <Pill tone={sc.tone} dot={sc.dot}>{sc.label}</Pill>
              {props.cityHighlight && <Pill tone="amber">City match</Pill>}
            </div>

            {/* Meta row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3" aria-hidden="true">
                  <circle cx="7" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M3.5 12v-.5a3.5 3.5 0 017 0V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                {p.workingDomain}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3" aria-hidden="true">
                  <path d="M7 1C4.79 1 3 2.79 3 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                {p.city}, {p.country}
              </span>
              <span>·</span>
              <span>Expires {p.expiryDate}</span>
            </div>

            {/* Description */}
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{p.shortExplanation}</p>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${p.expertiseRequired === 'medical' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'}`}>
                {p.expertiseRequired === 'medical' ? '🏥 Needs medical expertise' : '⚙️ Needs engineering'}
              </span>
              <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                {stageLabelShort[p.projectStage]}
              </span>
              <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600 capitalize">
                {p.collaborationType.replaceAll('_', ' ')}
              </span>
            </div>
          </div>

          {/* Owner */}
          <div className="flex shrink-0 items-center gap-2.5 sm:flex-col sm:items-end sm:gap-1">
            <Avatar name={owner?.name ?? '?'} role={owner?.role} size="sm" />
            <div className="text-right">
              <div className="text-xs font-medium text-slate-700">{owner?.name ?? 'Unknown'}</div>
              <div className="text-[10px] text-slate-400 capitalize">{owner?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
