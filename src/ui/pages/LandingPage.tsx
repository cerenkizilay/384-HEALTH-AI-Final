import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { Card, Button, Pill } from '../components/Ui'

export function LandingPage() {
  const nav = useNavigate()
  const u = getCurrentUser()

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Pill>Structured co-creation</Pill>
              <Pill tone="green">Trust-first workflow</Pill>
              <Pill tone="amber">NDA-first meeting request</Pill>
              <Pill tone="rose">No files • No patient data</Pill>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Find the right health-tech partner without oversharing.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
              A secure, GDPR-minded platform for first-contact between engineers and healthcare professionals:
              structured announcements, controlled disclosure, transparent meeting workflow, and clear closure.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {u ? (
                <>
                  <Button onClick={() => nav('/posts')}>Browse announcements</Button>
                  <Button variant="secondary" onClick={() => nav('/posts/new')}>
                    Create announcement
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => nav('/register')}>Register with .edu</Button>
                  <Button variant="secondary" onClick={() => nav('/login')}>
                    Log in
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid w-full max-w-sm gap-3">
            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <IconShield />
                <div>
                  <div className="text-sm font-semibold">Trust-first</div>
                  <div className="mt-1 text-sm text-slate-600">
                    NDA acceptance is required for meeting requests. Meetings happen externally (Zoom/Teams).
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <IconSpark />
                <div>
                  <div className="text-sm font-semibold">Fast posting</div>
                  <div className="mt-1 text-sm text-slate-600">
                    High-level only—domain, stage, commitment, and required expertise. No sensitive uploads.
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <IconCompass />
                <div>
                  <div className="text-sm font-semibold">Clear outcomes</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Discover partners, schedule a meeting, then mark “Partner Found” to close.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm font-semibold">Post an announcement</div>
          <div className="mt-1 text-sm text-slate-600">
            Create a short structured post: domain, stage, commitment, and what expertise you need.
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold">Express interest</div>
          <div className="mt-1 text-sm text-slate-600">
            Send a short message. Propose time slots. Meeting requests require NDA acceptance.
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold">Close it clearly</div>
          <div className="mt-1 text-sm text-slate-600">
            Mark “Partner Found” to close. Expiry support keeps the board clean.
          </div>
        </Card>
      </div>
    </div>
  )
}

function IconShield() {
  return (
    <svg className="mt-0.5 h-5 w-5 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9.5 12l1.8 1.8L14.8 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconSpark() {
  return (
    <svg className="mt-0.5 h-5 w-5 text-sky-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.4 5.2L18 9l-4.6 1.8L12 16l-1.4-5.2L6 9l4.6-1.8L12 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M19 14l.9 3.3L23 18l-3.1 1.2L19 22l-.9-2.8L15 18l3.1-.7L19 14z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function IconCompass() {
  return (
    <svg className="mt-0.5 h-5 w-5 text-amber-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M14.5 9.5l-2 5-5 2 2-5 5-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

