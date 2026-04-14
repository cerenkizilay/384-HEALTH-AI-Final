import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { db } from '../../lib/db'
import type { Post, PostStatus, ProjectStage } from '../../lib/models'
import { Card, Button, Pill, Select, TextInput } from '../components/Ui'

function statusTone(s: PostStatus): 'slate' | 'green' | 'amber' | 'rose' {
  if (s === 'active') return 'green'
  if (s === 'meeting_scheduled') return 'amber'
  if (s === 'closed') return 'slate'
  if (s === 'expired') return 'rose'
  return 'slate'
}

const stageLabels: Record<ProjectStage, string> = {
  idea: 'Idea',
  concept_validation: 'Concept validation',
  prototype_developed: 'Prototype developed',
  pilot_testing: 'Pilot testing',
  pre_deployment: 'Pre-deployment',
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

  const myCity = u.role === 'admin' ? '' : u.email.split('@')[1] // meaningless, but keeps demo deterministic
  const cityMatches = useMemo(() => {
    if (!city) return new Set<string>()
    return new Set(posts.filter((p) => p.city.toLowerCase() === city.trim().toLowerCase()).map((p) => p.id))
  }, [posts, city])

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
          <p className="mt-1 text-sm text-slate-600">
            Filter by domain, expertise need, location, stage, and status. City matches are highlighted.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setFiltersOpen((x) => !x)}>
            {filtersOpen ? 'Hide filters' : 'Show filters'}
          </Button>
          <Link to="/posts/new">
            <Button>Create announcement</Button>
          </Link>
        </div>
      </div>

      {filtersOpen ? (
        <Card className="p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-semibold text-slate-900">Filters</div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <Pill>Showing: {status || 'any'}</Pill>
              {city ? <Pill tone="amber">City highlight on</Pill> : <Pill tone="slate">City highlight off</Pill>}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <TextInput label="Search" value={q} onChange={setQ} placeholder="Keyword…" />
            <TextInput label="Domain contains" value={domain} onChange={setDomain} placeholder="e.g., cardiology imaging" />
            <TextInput
              label="City (exact)"
              value={city}
              onChange={setCity}
              placeholder="e.g., Ankara"
              hint={myCity ? `Tip: city highlighting is active when a city is entered.` : undefined}
            />
            <TextInput label="Country (exact)" value={country} onChange={setCountry} placeholder="e.g., Turkey" />
            <Select
              label="Project stage"
              value={stage}
              onChange={(v) => setStage(v as ProjectStage | '')}
              options={[
                { value: '', label: 'Any' },
                ...Object.entries(stageLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as PostStatus | '')}
              options={[
                { value: '', label: 'Any' },
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
                { value: 'closed', label: 'Partner Found (Closed)' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {posts.length === 0 ? (
          <Card>
            <div className="text-sm text-slate-600">No posts match your filters.</div>
          </Card>
        ) : (
          posts.map((p) => <PostRow key={p.id} post={p} highlight={city ? cityMatches.has(p.id) : false} />)
        )}
      </div>
    </div>
  )
}

function PostRow(props: { post: Post; highlight: boolean }) {
  const p = props.post
  const owner = db.get().users.find((u) => u.id === p.ownerUserId)
  const matchExplanation = `${p.expertiseRequired === 'medical' ? 'Needs medical expertise' : 'Needs engineering expertise'} • ${p.projectStage.replaceAll('_', ' ')}`

  return (
    <Link to={`/posts/${p.id}`}>
      <Card
        className={`relative overflow-hidden p-5 transition hover:border-slate-300 hover:bg-white ${
          props.highlight ? 'ring-2 ring-amber-300' : ''
        }`}
      >
        <div
          className={`absolute inset-y-0 left-0 w-1 ${
            p.status === 'active'
              ? 'bg-gradient-to-b from-emerald-500 to-sky-500'
              : p.status === 'meeting_scheduled'
                ? 'bg-gradient-to-b from-amber-400 to-rose-400'
                : p.status === 'expired'
                  ? 'bg-gradient-to-b from-rose-500 to-slate-400'
                  : 'bg-gradient-to-b from-slate-400 to-slate-300'
          }`}
        />
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-base font-semibold tracking-tight">{p.title}</div>
              <Pill tone={statusTone(p.status)}>{p.status.replaceAll('_', ' ')}</Pill>
              {props.highlight ? <Pill tone="amber">City match</Pill> : null}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {p.workingDomain} • {p.city}, {p.country}
            </div>
            <div className="mt-2 text-sm text-slate-700">{p.shortExplanation}</div>
            <div className="mt-2 text-xs text-slate-500">Match: {matchExplanation}</div>
          </div>
          <div className="shrink-0 text-sm text-slate-600">
            <div className="text-xs text-slate-500">Posted by</div>
            <div className="font-medium text-slate-900">{owner?.name ?? 'Unknown'}</div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

