import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { confirmEmailVerificationCode, requestEmailVerificationCode } from '../../lib/auth'
import { Card, Button, TextInput } from '../components/Ui'

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

    // Auto-resend when 3-minute timer finishes so user never needs to click.
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
    <div className="mx-auto max-w-xl">
      <Card className="p-6">
        <h1 className="text-xl font-semibold tracking-tight">Verify your email</h1>
        <p className="mt-1 text-sm text-slate-600">
          We will send a one-time code to your email. Enter the code below to verify your account.
        </p>

        <form
          className="mt-5 grid gap-4"
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
          <TextInput label="Email" value={email} onChange={setEmail} type="email" placeholder="name@example.com" />
          <TextInput label="Verification code" value={code} onChange={setCode} placeholder="6-digit code" />
          {sent ? (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">
              Verification code sent automatically. Check your inbox/spam. New code in {mm}:{ss}
            </div>
          ) : null}
          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          {done ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Verified. You can log in now.</div> : null}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!email || !code || busy}>
              {busy ? 'Please wait...' : 'Verify'}
            </Button>
            <Button variant="secondary" onClick={() => nav('/login')}>
              Go to login
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

