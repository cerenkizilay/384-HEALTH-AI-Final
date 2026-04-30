import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { confirmEmailVerificationCode, requestEmailVerificationCode } from '../../lib/auth'
import { Alert, Button, Card, TextInput } from '../components/Ui'

export function VerifyEmailPage() {
  const nav = useNavigate()
  const loc = useLocation()
  const initialEmail = useMemo(() => (loc.state as { email?: string } | null)?.email ?? '', [loc.state])

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [lastSentEmail, setLastSentEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const normalizedEmail = email.trim().toLowerCase()
  const canAutoSend = normalizedEmail.includes('@') && normalizedEmail.split('@')[1]?.includes('.')

  useEffect(() => {
    if (!canAutoSend || busy || done) return
    if (lastSentEmail === normalizedEmail && cooldown > 0) return
    const timeout = window.setTimeout(async () => {
      setError(null)
      try {
        setBusy(true)
        await requestEmailVerificationCode(normalizedEmail)
        setSent(true)
        setLastSentEmail(normalizedEmail)
        setCooldown(180)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send code.')
      } finally {
        setBusy(false)
      }
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [canAutoSend, busy, cooldown, done, lastSentEmail, normalizedEmail])

  useEffect(() => {
    if (cooldown <= 0) return
    const tick = window.setInterval(() => {
      setCooldown((x) => (x > 0 ? x - 1 : 0))
    }, 1000)
    return () => window.clearInterval(tick)
  }, [cooldown])

  useEffect(() => {
    if (!sent || done || busy) return
    if (cooldown !== 0) return
    if (!canAutoSend || lastSentEmail !== normalizedEmail) return
    void (async () => {
      setError(null)
      try {
        setBusy(true)
        await requestEmailVerificationCode(normalizedEmail)
        setCooldown(180)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resend code.')
      } finally {
        setBusy(false)
      }
    })()
  }, [busy, canAutoSend, cooldown, done, lastSentEmail, normalizedEmail, sent])

  const mm = String(Math.floor(cooldown / 60)).padStart(2, '0')
  const ss = String(cooldown % 60).padStart(2, '0')

  return (
    <div className="mx-auto max-w-lg py-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 shadow-lg shadow-teal-600/25">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white" aria-hidden="true">
            <path d="M3 8l9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-500">
          We'll send a one-time code to your email address to verify your account.
        </p>
      </div>

      <Card className="p-7">
        {done ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-emerald-600" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Email verified!</h2>
            <p className="mt-2 text-sm text-slate-500">Your account is now active. You can sign in.</p>
            <Button className="mt-5 w-full" size="lg" onClick={() => nav('/login')}>
              Go to login
            </Button>
          </div>
        ) : (
          <form
            className="grid gap-5"
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)
              try {
                setBusy(true)
                await confirmEmailVerificationCode(email, code)
                setDone(true)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Verification failed.')
              } finally {
                setBusy(false)
              }
            }}
          >
            <TextInput label="Email address" value={email} onChange={setEmail} type="email" placeholder="name@institution.edu" />

            {sent && (
              <Alert tone="info">
                Verification code sent to your inbox. Check your spam folder too.
                <br />
                <span className="font-semibold">New code in {mm}:{ss}</span>
              </Alert>
            )}

            <TextInput
              label="6-digit verification code"
              value={code}
              onChange={setCode}
              placeholder="000000"
            />

            {error && <Alert tone="error">{error}</Alert>}

            <div className="flex gap-3">
              <Button type="submit" size="lg" className="flex-1" disabled={!email || !code || busy}>
                {busy ? 'Verifying…' : 'Verify email'}
              </Button>
              <Button variant="secondary" onClick={() => nav('/login')}>
                Back to login
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
