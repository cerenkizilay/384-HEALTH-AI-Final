import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Role } from '../../lib/models'
import { register } from '../../lib/auth'
import { Card, Button, InlineLink, Select, TextInput } from '../components/Ui'

export function RegisterPage() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Exclude<Role, 'admin'>>('engineer')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-6">
        <h1 className="text-xl font-semibold tracking-tight">Register</h1>
        <p className="mt-1 text-sm text-slate-600">
          Registration is restricted to <span className="font-medium text-slate-900">institutional .edu</span> emails. Email verification
          is required.
        </p>

        <form
          className="mt-5 grid gap-4"
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
          <TextInput label="Full name" value={name} onChange={setName} placeholder="Your name" />
          <TextInput label="Institutional email" value={email} onChange={setEmail} type="email" placeholder="name@university.edu" />
          <Select
            label="Role"
            value={role}
            onChange={(v) => setRole(v as Exclude<Role, 'admin'>)}
            options={[
              { value: 'engineer', label: 'Engineer' },
              { value: 'healthcare', label: 'Healthcare Professional' },
            ]}
          />
          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          <div className="flex items-center justify-between gap-3">
            <Button type="submit">Create account</Button>
            <div className="text-sm text-slate-600">
              Already have an account? <InlineLink to="/login">Log in</InlineLink>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}

