import { useMemo, useState } from 'react'
import { db } from '../../lib/db'
import { getCurrentUser } from '../../lib/auth'
import { removePostAdmin } from '../../lib/posts'
import { audit } from '../../lib/audit'
import type { Role } from '../../lib/models'
import { Avatar, Button, Card, Pill, StatCard, TextInput } from '../components/Ui'

type Tab = 'overview' | 'posts' | 'users' | 'logs'

export function AdminPage() {
  const u = getCurrentUser()!
  const data = db.get()

  const [tab, setTab] = useState<Tab>('overview')
  const [postCity, setPostCity] = useState('')
  const [postDomain, setPostDomain] = useState('')
  const [postStatus, setPostStatus] = useState('')
  const [userRole, setUserRole] = useState<Role | ''>('')
  const [logQ, setLogQ] = useState('')

  const filteredPosts = useMemo(() => {
    return data.posts.filter((p) => {
      if (postCity && p.city.toLowerCase() !== postCity.trim().toLowerCase()) return false
      if (postDomain && !p.workingDomain.toLowerCase().includes(postDomain.trim().toLowerCase())) return false
      if (postStatus && p.status !== postStatus) return false
      return true
    })
  }, [data.posts, postCity, postDomain, postStatus])

  const filteredUsers = useMemo(() => {
    return data.users.filter((x) => {
      if (userRole && x.role !== userRole) return false
      return true
    })
  }, [data.users, userRole])

  const filteredLogs = useMemo(() => {
    const q = logQ.trim().toLowerCase()
    if (!q) return data.logs.slice(0, 200)
    return data.logs
      .filter((l) => {
        const hay = `${l.at} ${l.actionType} ${l.userId ?? ''} ${l.role ?? ''} ${l.targetEntity ?? ''} ${l.details ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 200)
  }, [data.logs, logQ])

  // Stats
  const activePosts = data.posts.filter((p) => p.status === 'active').length
  const closedPosts = data.posts.filter((p) => p.status === 'closed').length
  const pendingMeetings = data.meetings.filter((m) => m.status === 'pending').length
  const verifiedUsers = data.users.filter((u) => u.verified).length

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'posts', label: `Posts (${data.posts.length})` },
    { id: 'users', label: `Users (${data.users.length})` },
    { id: 'logs', label: `Logs (${data.logs.length})` },
  ]

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">RBAC protected · Logged in as {u.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total users"
              value={data.users.length}
              tone="teal"
              icon={
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                  <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 18v-1a6 6 0 0112 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 9a3 3 0 010 6M16 9.5v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            />
            <StatCard
              label="Active posts"
              value={activePosts}
              tone="blue"
              icon={
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                  <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 9h8M6 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            />
            <StatCard
              label="Partners matched"
              value={closedPosts}
              tone="violet"
              icon={
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M3 10s2-4 7-4 7 4 7 4-2 4-7 4-7-4-7-4z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              }
            />
            <StatCard
              label="Pending meetings"
              value={pendingMeetings}
              tone="amber"
              icon={
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                  <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 9h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            />
          </div>

          {/* Summary grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">User breakdown</div>
              <div className="grid gap-2">
                {[
                  { label: 'Engineers', value: data.users.filter((u) => u.role === 'engineer').length, tone: 'blue' as const },
                  { label: 'Healthcare', value: data.users.filter((u) => u.role === 'healthcare').length, tone: 'teal' as const },
                  { label: 'Admins', value: data.users.filter((u) => u.role === 'admin').length, tone: 'violet' as const },
                  { label: 'Verified', value: verifiedUsers, tone: 'teal' as const },
                  { label: 'Suspended', value: data.users.filter((u) => u.suspended).length, tone: 'slate' as const },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-semibold text-slate-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Post breakdown</div>
              <div className="grid gap-2">
                {[
                  { label: 'Active', value: activePosts },
                  { label: 'Meeting scheduled', value: data.posts.filter((p) => p.status === 'meeting_scheduled').length },
                  { label: 'Partner found', value: closedPosts },
                  { label: 'Expired', value: data.posts.filter((p) => p.status === 'expired').length },
                  { label: 'Draft', value: data.posts.filter((p) => p.status === 'draft').length },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-semibold text-slate-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Meeting breakdown</div>
              <div className="grid gap-2">
                {[
                  { label: 'Pending', value: pendingMeetings },
                  { label: 'Accepted', value: data.meetings.filter((m) => m.status === 'accepted').length },
                  { label: 'Declined', value: data.meetings.filter((m) => m.status === 'declined').length },
                  { label: 'Cancelled', value: data.meetings.filter((m) => m.status === 'cancelled').length },
                  { label: 'Total log entries', value: data.logs.length },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-semibold text-slate-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Posts management */}
      {tab === 'posts' && (
        <Card className="p-6">
          <div className="mb-4">
            <div className="text-base font-semibold text-slate-900">Post management</div>
            <p className="mt-1 text-sm text-slate-500">Filter and remove inappropriate posts.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 mb-5">
            <TextInput label="Filter by city" value={postCity} onChange={setPostCity} placeholder="e.g., Ankara" />
            <TextInput label="Domain contains" value={postDomain} onChange={setPostDomain} placeholder="e.g., imaging" />
            <TextInput label="Status" value={postStatus} onChange={setPostStatus} placeholder="active / closed / expired…" />
          </div>

          <div className="grid gap-2">
            {filteredPosts.map((p) => {
              const owner = data.users.find((x) => x.id === p.ownerUserId)
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{p.title}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 capitalize">{p.status.replaceAll('_', ' ')}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {p.workingDomain} · {p.city} · Owner: {owner?.name ?? 'Unknown'} ({owner?.role})
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Remove this post? This cannot be undone.')) {
                        removePostAdmin(p.id, u.id)
                        window.location.reload()
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )
            })}
            {filteredPosts.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">No posts match your filters.</div>
            )}
          </div>
        </Card>
      )}

      {/* Users management */}
      {tab === 'users' && (
        <Card className="p-6">
          <div className="mb-4">
            <div className="text-base font-semibold text-slate-900">User management</div>
            <p className="mt-1 text-sm text-slate-500">View, filter, and suspend/unsuspend user accounts.</p>
          </div>
          <div className="mb-5">
            <div className="flex flex-wrap gap-2">
              {(['', 'engineer', 'healthcare', 'admin'] as const).map((role) => (
                <button
                  key={role || 'all'}
                  onClick={() => setUserRole(role)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    userRole === role
                      ? 'bg-teal-700 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            {filteredUsers.map((x) => (
              <UserRow key={x.id} userId={x.id} currentAdminId={u.id} />
            ))}
          </div>
        </Card>
      )}

      {/* Audit logs */}
      {tab === 'logs' && (
        <Card className="p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-base font-semibold text-slate-900">Audit logs</div>
              <p className="mt-1 text-sm text-slate-500">Search and export system audit trail.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const rows = filteredLogs.map((l) =>
                  [l.at, l.userId ?? '', l.role ?? '', l.actionType, l.targetEntity ?? '', l.result, l.details ?? '']
                    .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                    .join(','),
                )
                const csv = ['"at","userId","role","actionType","targetEntity","result","details"', ...rows].join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'healthai_audit_logs.csv'
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Export CSV
            </Button>
          </div>

          <div className="mb-4">
            <TextInput label="Search logs" value={logQ} onChange={setLogQ} placeholder="action, userId, target, details…" />
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 font-medium">User ID</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-slate-500">{l.at.slice(0, 19)}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 max-w-[120px] truncate">{l.userId ?? '—'}</td>
                    <td className="px-4 py-2.5 capitalize text-slate-600">{l.role ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-800 font-medium">{l.actionType.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-[150px] truncate">{l.targetEntity ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${l.result === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {l.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">No log entries match your search.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

function UserRow(props: { userId: string; currentAdminId: string }) {
  const data = db.get()
  const user = data.users.find((x) => x.id === props.userId)!
  const [confirmSuspend, setConfirmSuspend] = useState(false)

  const roleTone = user.role === 'engineer' ? 'blue' : user.role === 'healthcare' ? 'teal' : 'violet'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={user.name} role={user.role} size="sm" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 truncate">{user.name}</span>
            <Pill tone={roleTone}>{user.role}</Pill>
            {user.verified ? <Pill tone="green">Verified</Pill> : <Pill tone="amber">Unverified</Pill>}
            {user.suspended && <Pill tone="rose">Suspended</Pill>}
          </div>
          <div className="mt-0.5 text-xs text-slate-400 truncate">{user.email}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {confirmSuspend ? (
          <>
            <span className="text-xs text-slate-500">Confirm?</span>
            <Button
              size="sm"
              variant={user.suspended ? 'primary' : 'danger'}
              onClick={() => {
                db.update((d) => {
                  const idx = d.users.findIndex((x) => x.id === user.id)
                  d.users[idx] = { ...d.users[idx], suspended: !d.users[idx].suspended }
                })
                audit({
                  userId: props.currentAdminId,
                  role: 'admin',
                  actionType: user.suspended ? 'admin_user_unsuspend' : 'admin_user_suspend',
                  result: 'success',
                  targetEntity: user.id,
                })
                window.location.reload()
              }}
            >
              Yes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmSuspend(false)}>No</Button>
          </>
        ) : (
          <Button
            size="sm"
            variant={user.suspended ? 'secondary' : 'danger'}
            onClick={() => setConfirmSuspend(true)}
          >
            {user.suspended ? 'Unsuspend' : 'Suspend'}
          </Button>
        )}
      </div>
    </div>
  )
}
