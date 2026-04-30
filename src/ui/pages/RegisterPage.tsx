import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Role } from '../../lib/models'
import { register } from '../../lib/auth'
import { Alert, Button, Card, InlineLink, TextInput } from '../components/Ui'

const roles: Array<{
  value: Exclude<Role, 'admin'>
  label: string
  desc: string
  icon: React.ReactNode
  color: string
}> = [
  {
    value: 'engineer',
    label: 'Engineer',
    desc: 'I develop health-tech solutions and need clinical expertise.',
    color: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
        <path d="M12 3l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V7l7-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M9.5 12.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'healthcare',
    label: 'Healthcare Professional',
    desc: 'I have medical expertise and ideas that need technical implementation.',
    color: 'teal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M4 20v-1a8 8 0 0116 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 13v3M10.5 14.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function RegisterPage() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Exclude<Role, 'admin'>>('engineer')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-lg py-4">
      {/* Logo + header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 shadow-lg shadow-teal-600/25">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white" aria-hidden="true">
            <path d="M10 8.5h4M12 6.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.2"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-500">
          Join the HEALTH AI co-creation platform with your institutional email.
        </p>
      </div>

      <Card className="p-7">
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            try {
              register({ name, email, role })
              nav('/verify-email', { state: { email } })
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Registration failed.')
            }
          }}
        >
          {/* Role selection */}
          <div>
            <div className="mb-2.5 text-sm font-medium text-slate-700">I am a…</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                    role === r.value
                      ? r.color === 'blue'
                        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-teal-400 bg-teal-50 ring-2 ring-teal-200'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`shrink-0 rounded-lg p-2 ${
                      role === r.value
                        ? r.color === 'blue'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-teal-100 text-teal-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {r.icon}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${role === r.value ? 'text-slate-900' : 'text-slate-700'}`}>
                      {r.label}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <TextInput label="Full name" value={name} onChange={setName} placeholder="Your full name" required />

          <div>
            <TextInput
              label="Institutional email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="name@university.edu"
              required
            />
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 5v2M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="text-xs text-slate-500">
                Platform access requires an institutional email address. Personal providers (Gmail, Outlook, etc.) are not permitted.
              </span>
            </div>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" size="lg" className="w-full">
            Create account
          </Button>

          <div className="text-center text-sm text-slate-500">
            Already registered?{' '}
            <InlineLink to="/login">Log in</InlineLink>
          </div>
        </form>
      </Card>

      <p className="mt-5 text-center text-xs text-slate-400">
        By registering, you agree to keep posted content high-level and confidentiality-aware.
        No patient data or IP documents may be shared on this platform.
      </p>
    </div>
  )
}
