import { Outlet } from 'react-router-dom'
import { TopNav } from '../components/TopNav'

export function AppLayout() {
  return (
    <div className="page-bg flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1 py-8">
        <div className="app-container">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-slate-200/60 bg-white/60 py-6">
        <div className="app-container">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-white" aria-hidden="true">
                  <path d="M10 8.5h4M12 6.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.2"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-700">HEALTH AI</span>
            </div>
            <p className="text-center text-xs text-slate-400">
              Co-Creation Platform · No patient data · No file uploads · GDPR-minded · Meetings happen externally
            </p>
            <p className="text-xs text-slate-400">© {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
