import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { db } from '../../lib/db'
import { getCurrentUser, logout } from '../../lib/auth'
import { Avatar, Pill } from './Ui'

export function TopNav() {
  const nav = useNavigate()
  const loc = useLocation()
  const u = getCurrentUser()
  const [menuOpen, setMenuOpen] = useState(false)

  const { pendingMeetings, activeChats } = (() => {
    if (!u) return { pendingMeetings: 0, activeChats: 0 }
    const meetings = db.get().meetings.filter(
      (m) => m.fromUserId === u.id || m.toUserId === u.id,
    )
    return {
      pendingMeetings: meetings.filter((m) => m.status === 'pending').length,
      activeChats: meetings.filter((m) => m.status === 'accepted').length,
    }
  })()

  const roleTone = u?.role === 'engineer' ? 'blue' : u?.role === 'healthcare' ? 'teal' : 'violet'
  const roleLabel = u ? db.roleLabel(u.role) : ''

  const navLinks = [
    { path: '/posts', label: 'Announcements' },
    ...(u ? [{ path: '/my-posts', label: 'My Posts' }] : []),
    ...(u ? [{ path: '/chats', label: 'Chats' }] : []),
    ...(u?.role === 'admin' ? [{ path: '/admin', label: 'Admin' }] : []),
  ]

  const isActive = (path: string) => loc.pathname === path || loc.pathname.startsWith(path + '/')

  function handleLogout() {
    logout()
    nav('/')
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
      <div className="app-container">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 shadow-sm shadow-teal-600/25 transition group-hover:shadow-teal-600/40">
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-white" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.3"/>
                <path d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="currentColor"/>
                <path d="M10 8.5h4M12 6.5v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">HEALTH AI</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
                {link.path === '/my-posts' && pendingMeetings > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {pendingMeetings}
                  </span>
                )}
                {link.path === '/chats' && activeChats > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                    {activeChats}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-2">
            {u ? (
              <>
                {/* User info - desktop */}
                <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 md:flex">
                  <Avatar name={u.name} role={u.role} size="sm" />
                  <div className="min-w-0">
                    <div className="max-w-[120px] truncate text-xs font-semibold text-slate-900">{u.name}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">{roleTone && <Pill tone={roleTone} >{roleLabel}</Pill>}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M13 10H3m0 0l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6V5a2 2 0 012-2h5a2 2 0 012 2v10a2 2 0 01-2 2h-5a2 2 0 01-2-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-700/20 transition hover:bg-teal-600"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setMenuOpen((x) => !x)}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                {menuOpen ? (
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-slate-100 py-3 md:hidden">
            {u && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <Avatar name={u.name} role={u.role} size="sm" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-500">{roleLabel}</div>
                </div>
              </div>
            )}
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive(link.path) ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                  {link.path === '/my-posts' && pendingMeetings > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                      {pendingMeetings}
                    </span>
                  )}
                  {link.path === '/chats' && activeChats > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                      {activeChats}
                    </span>
                  )}
                </Link>
              ))}
              {u && (
                <button
                  onClick={handleLogout}
                  className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Log out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
