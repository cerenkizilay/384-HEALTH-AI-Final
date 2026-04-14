import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Card(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm backdrop-blur transition hover:border-slate-300/70 ${props.className ?? ''}`}
    >
      {props.children}
    </div>
  )
}

export function Button(props: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  disabled?: boolean
  className?: string
}) {
  const v = props.variant ?? 'primary'
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50'
  const styles =
    v === 'primary'
      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white shadow-sm shadow-emerald-600/20 hover:brightness-105'
      : v === 'danger'
        ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-500'
        : v === 'ghost'
          ? 'bg-transparent text-slate-700 hover:bg-slate-100'
          : 'border border-slate-200 bg-white/80 text-slate-900 shadow-sm hover:bg-white'
  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`${base} ${styles} ${props.className ?? ''}`}
    >
      {props.children}
    </button>
  )
}

export function TextInput(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password'
  hint?: string
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-semibold text-slate-900">{props.label}</div>
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-400"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        type={props.type ?? 'text'}
      />
      {props.hint ? <div className="mt-1 text-xs text-slate-500">{props.hint}</div> : null}
    </label>
  )
}

export function Select(props: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-semibold text-slate-900">{props.label}</div>
      <select
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Pill(props: { children: ReactNode; tone?: 'slate' | 'green' | 'amber' | 'rose' }) {
  const tone = props.tone ?? 'slate'
  const cls =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : tone === 'rose'
          ? 'bg-rose-50 text-rose-700 ring-rose-200'
          : 'bg-slate-100/70 text-slate-700 ring-slate-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}>
      {props.children}
    </span>
  )
}

export function InlineLink(props: { to: string; children: ReactNode }) {
  return (
    <Link to={props.to} className="font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700">
      {props.children}
    </Link>
  )
}

