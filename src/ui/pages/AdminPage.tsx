import { useMemo, useState } from 'react'
import { db } from '../../lib/db'
import { getCurrentUser } from '../../lib/auth'
import { removePostAdmin } from '../../lib/posts'
import { audit } from '../../lib/audit'
import type { Role } from '../../lib/models'
import { Card, Button, Pill, TextInput } from '../components/Ui'

export function AdminPage() {
  const u = getCurrentUser()!
  const data = db.get()

  const [tab, setTab] = useState<'posts' | 'users' | 'logs' | 'stats'>('posts')
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

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">RBAC: this page is accessible only to Admin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabButton active={tab === 'posts'} onClick={() => setTab('posts')}>
            Posts
          </TabButton>
          <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
            Users
          </TabButton>
          <TabButton active={tab === 'logs'} onClick={() => setTab('logs')}>
            Logs
          </TabButton>
          <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}>
            Stats
          </TabButton>
        </div>
      </div>

      {tab === 'posts' ? (
        <Card className="p-5">
          <div className="text-sm font-semibold">Post management</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <TextInput label="Filter by city" value={postCity} onChange={setPostCity} placeholder="e.g., Ankara" />
            <TextInput label="Filter by domain contains" value={postDomain} onChange={setPostDomain} placeholder="e.g., imaging" />
            <TextInput label="Filter by status" value={postStatus} onChange={setPostStatus} placeholder="active/closed/expired…" />
          </div>

          <div className="mt-4 grid gap-3">
            {filteredPosts.map((p) => {
              const owner = data.users.find((x) => x.id === p.ownerUserId)
              return (
                <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold">{p.title}</div>
                      <Pill>{p.status}</Pill>
                      <Pill tone="slate">{p.city}</Pill>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Owner: {owner?.name ?? 'Unknown'} • {p.workingDomain}
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => {
                      removePostAdmin(p.id, u.id)
                      window.location.reload()
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}

      {tab === 'users' ? (
        <Card className="p-5">
          <div className="text-sm font-semibold">User management</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <TextInput
              label="Filter by role"
              value={userRole}
              onChange={(v) => setUserRole((v as Role) || '')}
              placeholder="engineer/healthcare/admin"
            />
            <div className="text-sm text-slate-600">
              Suspend/unsuspend is implemented (demo) via a button.
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {filteredUsers.map((x) => (
              <UserRow key={x.id} userId={x.id} />
            ))}
          </div>
        </Card>
      ) : null}

      {tab === 'logs' ? (
        <Card className="p-5">
          <div className="text-sm font-semibold">Audit logs</div>
          <p className="mt-1 text-sm text-slate-600">Filter and export (CSV) are supported in demo.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <TextInput label="Search logs" value={logQ} onChange={setLogQ} placeholder="action/userId/target/details…" />
            <div className="flex items-end justify-start md:justify-end">
              <Button
                variant="secondary"
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
          </div>

          <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-200">
                    <td className="px-3 py-2 whitespace-nowrap">{l.at}</td>
                    <td className="px-3 py-2">{l.userId ?? '-'}</td>
                    <td className="px-3 py-2">{l.role ?? '-'}</td>
                    <td className="px-3 py-2">{l.actionType}</td>
                    <td className="px-3 py-2">{l.targetEntity ?? '-'}</td>
                    <td className="px-3 py-2">{l.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === 'stats' ? (
        <Card className="p-5">
          <div className="text-sm font-semibold">Platform statistics</div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Stat label="Users" value={String(data.users.length)} />
            <Stat label="Posts" value={String(data.posts.length)} />
            <Stat label="Meeting requests" value={String(data.meetings.length)} />
            <Stat label="Log entries" value={String(data.logs.length)} />
          </div>
        </Card>
      ) : null}
    </div>
  )
}

function TabButton(props: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={props.onClick}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        props.active ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {props.children}
    </button>
  )
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{props.label}</div>
      <div className="mt-1 text-lg font-semibold">{props.value}</div>
    </div>
  )
}

function UserRow(props: { userId: string }) {
  const u = getCurrentUser()!
  const data = db.get()
  const user = data.users.find((x) => x.id === props.userId)!

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-sm font-semibold">{user.name}</div>
          <Pill>{user.role}</Pill>
          {user.verified ? <Pill tone="green">verified</Pill> : <Pill tone="amber">unverified</Pill>}
          {user.suspended ? <Pill tone="rose">suspended</Pill> : null}
        </div>
        <div className="mt-1 text-xs text-slate-500">{user.email}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={user.suspended ? 'secondary' : 'danger'}
          onClick={() => {
            db.update((d) => {
              const idx = d.users.findIndex((x) => x.id === user.id)
              d.users[idx] = { ...d.users[idx], suspended: !d.users[idx].suspended }
            })
            audit({
              userId: u.id,
              role: 'admin',
              actionType: user.suspended ? 'admin_user_unsuspend' : 'admin_user_suspend',
              result: 'success',
              targetEntity: user.id,
            })
            window.location.reload()
          }}
        >
          {user.suspended ? 'Unsuspend' : 'Suspend'}
        </Button>
      </div>
    </div>
  )
}

