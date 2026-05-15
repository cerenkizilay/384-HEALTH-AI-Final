import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../lib/auth'
import { Alert, Button, Card, InlineLink, TextInput } from '../components/Ui'

export function LoginPage() {
  const nav = useNavigate()
  const loc = useLocation()
  const from = useMemo(() => (loc.state as { from?: string } | null)?.from ?? '/posts', [loc.state])

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with your registered email address.</p>
      </div>

      <Card className="p-7">
        {/* Demo accounts banner */}
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-sky-600 shrink-0" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 6v2M8 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <div className="text-sm font-semibold text-sky-900">Demo accounts</div>
          </div>
          <div className="grid gap-1.5">
            {[
              { email: 'engineer@demo.edu', role: 'Engineer', color: 'text-blue-700' },
              { email: 'doctor@demo.edu', role: 'Healthcare Professional', color: 'text-teal-700' },
              { email: 'admin@demo.edu', role: 'Admin', color: 'text-violet-700' },
            ].map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => setEmail(d.email)}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs transition hover:bg-slate-50 border border-sky-100"
              >
                <span className="font-mono text-slate-700">{d.email}</span>
                <span className={`font-medium ${d.color}`}>{d.role}</span>
              </button>
            ))}
          </div>
        </div>

        <form
          className="grid gap-5"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setBusy(true)
            try {
              await login(email)
              nav(from, { replace: true })
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Login failed.')
            } finally {
              setBusy(false)
            }
          }}
        >
          <TextInput
            label="Email address"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="name@institution.edu"
            required
          />

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" size="lg" className="w-full" disabled={!email || busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>

          <div className="text-center text-sm text-slate-500">
            New to HEALTH AI?{' '}
            <InlineLink to="/register">Create an account</InlineLink>
          </div>
        </form>
      </Card>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white/60 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M8 1.5L13 4v4c0 3.5-2 5.5-5 6.5-3-1-5-3-5-6.5V4L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700">Privacy first</div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              HEALTH AI is GDPR-minded. No patient data, no file uploads.
              Meetings happen externally via Zoom or Teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
