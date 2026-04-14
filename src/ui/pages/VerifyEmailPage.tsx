import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { verifyEmail } from '../../lib/auth'
import { Card, Button, TextInput } from '../components/Ui'

export function VerifyEmailPage() {
  const nav = useNavigate()
  const loc = useLocation()
  const initialEmail = useMemo(() => (loc.state as { email?: string } | null)?.email ?? '', [loc.state])

  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-6">
        <h1 className="text-xl font-semibold tracking-tight">Verify your email</h1>
        <p className="mt-1 text-sm text-slate-600">
          Demo flow: enter your email and click verify. (In production this would be a token link.)
        </p>

        <form
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            try {
              verifyEmail(email)
              setDone(true)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Verification failed.')
            }
          }}
        >
          <TextInput label="Email" value={email} onChange={setEmail} type="email" placeholder="name@university.edu" />
          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          {done ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Verified. You can log in now.</div> : null}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!email}>
              Verify
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

