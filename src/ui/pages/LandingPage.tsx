import { Link } from 'react-router-dom'
import { getCurrentUser } from '../../lib/auth'
import { db } from '../../lib/db'

export function LandingPage() {
  const u = getCurrentUser()
  const data = db.get()
  const activePosts = data.posts.filter((p) => p.status === 'active').length
  const closedPosts = data.posts.filter((p) => p.status === 'closed').length

  return (
    <div className="grid gap-16">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-800 px-8 py-16 shadow-xl shadow-teal-900/20 md:px-16 md:py-24">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-teal-400/8 blur-2xl" />
        </div>

        <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-white/90">European HealthTech Co-Creation Platform</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Bridge the gap between{' '}
              <span className="text-emerald-300">medicine</span> and{' '}
              <span className="text-sky-300">engineering</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-teal-100">
              HEALTH AI eliminates randomness from health-tech collaboration. Find the right partner through
              structured announcements, controlled disclosure, and a transparent meeting workflow — without
              oversharing your ideas.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {u ? (
                <>
                  <Link
                    to="/posts"
                    className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow-lg shadow-black/10 transition hover:bg-teal-50"
                  >
                    Browse Announcements
                  </Link>
                  <Link
                    to="/posts/new"
                    className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    Create Announcement
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow-lg shadow-black/10 transition hover:bg-teal-50"
                  >
                    Get started free
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>

            {/* Mini stats */}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <StatBadge value={activePosts || '10+'} label="Active announcements" />
              <StatBadge value={closedPosts || '5+'} label="Matches found" />
              <StatBadge value="2" label="Partner roles" />
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid gap-3">
            {[
              {
                icon: <IconShield />,
                title: 'Trust-first',
                desc: 'NDA acceptance required before meeting requests. No sensitive files stored — ever.',
                accent: 'from-emerald-400/20 to-teal-400/10',
              },
              {
                icon: <IconAnnouncement />,
                title: 'Structured announcements',
                desc: 'High-level domain, stage, commitment, and expertise — no IP revealed.',
                accent: 'from-sky-400/20 to-blue-400/10',
              },
              {
                icon: <IconCompass />,
                title: 'Clear closure',
                desc: 'Mark "Partner Found" to close. Auto-expiry keeps the board clean and honest.',
                accent: 'from-violet-400/20 to-purple-400/10',
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`flex items-start gap-4 rounded-2xl border border-white/10 bg-gradient-to-br ${f.accent} p-5 backdrop-blur-sm`}
              >
                <div className="mt-0.5 shrink-0 text-white/80">{f.icon}</div>
                <div>
                  <div className="font-semibold text-white">{f.title}</div>
                  <div className="mt-1 text-sm text-teal-100/80">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section>
        <div className="mb-10 text-center">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-600">Workflow</div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">How co-creation works</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            A secure, three-step process designed to protect your ideas while enabling meaningful collaboration.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: '01',
              icon: <IconPost />,
              title: 'Post an announcement',
              desc: 'Create a structured post: working domain, project stage, commitment level, and what expertise you need. Keep it high-level — no IP, no patient data.',
              color: 'teal',
            },
            {
              step: '02',
              icon: <IconMessage />,
              title: 'Express interest & request meeting',
              desc: 'Browse posts and send a short message. Propose time slots and accept the NDA for first-contact. Meetings happen externally via Zoom or Teams.',
              color: 'blue',
            },
            {
              step: '03',
              icon: <IconClose />,
              title: 'Find your partner & close',
              desc: 'When a collaboration is agreed upon, mark the announcement as "Partner Found". The post closes automatically, keeping the board honest.',
              color: 'emerald',
            },
          ].map((item) => (
            <div key={item.step} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    item.color === 'teal'
                      ? 'bg-teal-50 text-teal-600'
                      : item.color === 'blue'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-3xl font-bold text-slate-100">{item.step}</span>
              </div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who is it for ────────────────────────────────────────────────── */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-7">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <IconEngineer />
          </div>
          <h3 className="text-base font-semibold text-slate-900">For Engineers</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Building healthcare technology? Find clinicians who understand workflows, approval pathways, and
            ethical requirements. Post your announcement and get structured, NDA-protected introductions.
          </p>
          <ul className="mt-4 grid gap-1.5">
            {['Clinical workflow feedback', 'Validation process guidance', 'Ethical approval pathways', 'Research partnerships'].map(
              (item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true">
                    <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50 p-7">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
            <IconDoctor />
          </div>
          <h3 className="text-base font-semibold text-slate-900">For Healthcare Professionals</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Have a compelling health-tech idea but lack the engineering resources to implement it? Post your
            vision and connect with engineers who can bring it to life — safely and professionally.
          </p>
          <ul className="mt-4 grid gap-1.5">
            {['Frontend & backend development', 'System architecture', 'Data engineering', 'Prototype development'].map(
              (item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-teal-500" aria-hidden="true">
                    <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* ── Trust & compliance ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="mb-6 text-center">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">Privacy & security</div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Built for trust</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {[
            { icon: <IconGdpr />, title: 'GDPR-minded', desc: 'Minimal data collection. Right to delete. No patient data stored.' },
            { icon: <IconLock />, title: 'No file uploads', desc: 'Technical documentation and IP files are never stored on the platform.' },
            { icon: <IconNda />, title: 'NDA-first meetings', desc: 'Every meeting request requires explicit NDA acceptance before contact.' },
            { icon: <IconEdu />, title: 'Institutional emails', desc: 'Registration restricted to verified institutional email addresses.' },
          ].map((t) => (
            <div key={t.title} className="flex flex-col items-center gap-2.5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                {t.icon}
              </div>
              <div className="text-sm font-semibold text-slate-800">{t.title}</div>
              <div className="text-xs leading-relaxed text-slate-500">{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {!u && (
        <section className="rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-700 p-10 text-center shadow-lg shadow-teal-700/15">
          <h2 className="text-2xl font-bold text-white">Ready to find your health-tech partner?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-teal-100">
            Join with your institutional email. Post your announcement in under 3 minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-white px-7 py-3 text-sm font-semibold text-teal-900 shadow-md transition hover:bg-teal-50"
            >
              Create free account
            </Link>
            <Link
              to="/posts"
              className="rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Browse announcements
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Mini helpers ─────────────────────────────────────────────────────────────

function StatBadge(props: { value: string | number; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-white">{props.value}</div>
      <div className="text-xs text-teal-300">{props.label}</div>
    </div>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9.5 12l1.8 1.8L14.8 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function IconAnnouncement() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M14.5 9.5l-2 5-5 2 2-5 5-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  )
}

function IconPost() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8L14 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function IconMessage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8.5 12l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconEngineer() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M5 21v-2a7 7 0 0114 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16 12l1.5 2.5M20 10l-1.5 2.5M16 10l4 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconDoctor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M5 21v-2a7 7 0 0114 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconGdpr() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  )
}

function IconNda() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8L14 2z" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M14 2v6h6M8 12h5M8 16h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function IconEdu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M22 10v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M7 9.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
