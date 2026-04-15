import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../lib/auth'
import { Button, Card, InlineLink, TextInput } from '../components/Ui'

export function LoginPage() {
  const nav = useNavigate()
  const loc = useLocation()
  const from = useMemo(() => (loc.state as { from?: string } | null)?.from ?? '/posts', [loc.state])

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-xl">
      <Card className="overflow-hidden p-0">
        <div className="h-24 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="-mt-11 h-14 w-14 rounded-2xl border border-white/70 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 shadow-lg shadow-cyan-500/30" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
              <p className="text-sm text-slate-600">Institutional access only (.edu)</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900">
            <div className="font-semibold">Demo accounts</div>
            <div className="mt-1 text-cyan-800">engineer@demo.edu • doctor@demo.edu • admin@demo.edu</div>
          </div>

          {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

          <form
            className="mt-5 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              try {
                login(email)
                nav(from, { replace: true })
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Login failed.')
              }
            }}
          >
            <TextInput
              label="Institutional email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="name@university.edu"
            />

            <div className="flex items-center justify-between gap-3">
              <Button type="submit" disabled={!email}>
                Log in
              </Button>
              <div className="text-sm text-slate-600">
                New here? <InlineLink to="/register">Create an account</InlineLink>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

