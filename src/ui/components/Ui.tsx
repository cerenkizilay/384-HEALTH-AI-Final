import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card(props: { children: ReactNode; className?: string; hoverable?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${props.hoverable ? 'transition-all hover:border-teal-200 hover:shadow-md hover:-translate-y-0.5' : ''} ${props.className ?? ''}`}
    >
      {props.children}
    </div>
  )
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

export function SectionCard(props: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <Card className={`p-6 ${props.className ?? ''}`}>
      {(props.title || props.description) && (
        <div className="mb-5 border-b border-slate-100 pb-4">
          {props.title && <h2 className="text-base font-semibold text-slate-900">{props.title}</h2>}
          {props.description && <p className="mt-0.5 text-sm text-slate-500">{props.description}</p>}
        </div>
      )}
      {props.children}
    </Card>
  )
}

// ─── Button ──────────────────────────────────────────────────────────────────

export function Button(props: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}) {
  const v = props.variant ?? 'primary'
  const size = props.size ?? 'md'

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const base = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]}`

  const styles =
    v === 'primary'
      ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20 hover:bg-teal-600 focus:ring-teal-500 active:bg-teal-800'
      : v === 'danger'
        ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-500 focus:ring-rose-400'
        : v === 'ghost'
          ? 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300'
          : v === 'outline'
            ? 'border border-teal-600 text-teal-700 hover:bg-teal-50 focus:ring-teal-400'
            : 'border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-300'

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`${base} ${styles} ${props.className ?? ''}`}
    >
      {props.icon && <span className="shrink-0">{props.icon}</span>}
      {props.children}
    </button>
  )
}

// ─── TextInput ───────────────────────────────────────────────────────────────

export function TextInput(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password'
  hint?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1">
        <span className="text-sm font-medium text-slate-700">{props.label}</span>
        {props.required && <span className="text-rose-500">*</span>}
      </div>
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        type={props.type ?? 'text'}
      />
      {props.hint ? <div className="mt-1.5 text-xs text-slate-500">{props.hint}</div> : null}
    </label>
  )
}

// ─── Textarea ────────────────────────────────────────────────────────────────

export function Textarea(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  rows?: number
  required?: boolean
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1">
        <span className="text-sm font-medium text-slate-700">{props.label}</span>
        {props.required && <span className="text-rose-500">*</span>}
      </div>
      <textarea
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={props.rows ?? 3}
      />
      {props.hint ? <div className="mt-1.5 text-xs text-slate-500">{props.hint}</div> : null}
    </label>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────

export function Select(props: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  hint?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1">
        <span className="text-sm font-medium text-slate-700">{props.label}</span>
        {props.required && <span className="text-rose-500">*</span>}
      </div>
      <select
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {props.hint ? <div className="mt-1.5 text-xs text-slate-500">{props.hint}</div> : null}
    </label>
  )
}

// ─── Pill / Badge ─────────────────────────────────────────────────────────────

type PillTone = 'slate' | 'green' | 'amber' | 'rose' | 'blue' | 'teal' | 'violet'

export function Pill(props: { children: ReactNode; tone?: PillTone; dot?: boolean }) {
  const tone = props.tone ?? 'slate'
  const cls: Record<PillTone, string> = {
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    teal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
    violet: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    slate: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  }
  const dotCls: Record<PillTone, string> = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    blue: 'bg-blue-500',
    teal: 'bg-teal-500',
    violet: 'bg-violet-500',
    slate: 'bg-slate-400',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls[tone]}`}>
      {props.dot && <span className={`h-1.5 w-1.5 rounded-full ${dotCls[tone]}`} />}
      {props.children}
    </span>
  )
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar(props: { name: string; role?: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = props.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const size = props.size ?? 'md'
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'

  const roleGradient =
    props.role === 'engineer'
      ? 'from-blue-500 to-indigo-600'
      : props.role === 'healthcare'
        ? 'from-teal-500 to-emerald-600'
        : props.role === 'admin'
          ? 'from-violet-500 to-purple-600'
          : 'from-slate-400 to-slate-500'

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${roleGradient} font-semibold text-white ${sizeClass}`}
    >
      {initials}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

export function StatCard(props: { label: string; value: string | number; icon?: ReactNode; tone?: 'teal' | 'blue' | 'violet' | 'amber' }) {
  const tone = props.tone ?? 'teal'
  const iconBg = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{props.label}</div>
          <div className="mt-1.5 text-2xl font-bold text-slate-900">{props.value}</div>
        </div>
        {props.icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg[tone]}`}>
            {props.icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Alert ───────────────────────────────────────────────────────────────────

export function Alert(props: { children: ReactNode; tone?: 'error' | 'success' | 'info' | 'warning' }) {
  const tone = props.tone ?? 'error'
  const cls = {
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cls[tone]}`}>{props.children}</div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState(props: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {props.icon && <div className="mb-4 text-slate-300">{props.icon}</div>}
      <div className="text-base font-semibold text-slate-700">{props.title}</div>
      {props.description && <p className="mt-1.5 max-w-xs text-sm text-slate-500">{props.description}</p>}
      {props.action && <div className="mt-5">{props.action}</div>}
    </div>
  )
}

// ─── FormSection ─────────────────────────────────────────────────────────────

export function FormSection(props: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{props.title}</h3>
        {props.description && <p className="mt-0.5 text-xs text-slate-500">{props.description}</p>}
      </div>
      <div className="grid gap-4">{props.children}</div>
    </div>
  )
}

// ─── InlineLink ───────────────────────────────────────────────────────────────

export function InlineLink(props: { to: string; children: ReactNode }) {
  return (
    <Link to={props.to} className="font-medium text-teal-700 underline-offset-4 hover:underline">
      {props.children}
    </Link>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider(props: { label?: string }) {
  if (!props.label) return <hr className="border-slate-100" />
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-slate-200" />
      <span className="text-xs text-slate-400">{props.label}</span>
      <hr className="flex-1 border-slate-200" />
    </div>
  )
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader(props: { title: string; description?: string; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {props.back && <div className="mb-2">{props.back}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{props.title}</h1>
        {props.description && <p className="mt-1 text-sm text-slate-500">{props.description}</p>}
      </div>
      {props.actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{props.actions}</div>}
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div className="flex h-8 w-8 animate-spin items-center justify-center rounded-full border-2 border-slate-200 border-t-teal-600" />
  )
}
