export function nowIso() {
  return new Date().toISOString()
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
}

export function isInstitutionalEduEmail(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  const at = email.lastIndexOf('@')
  if (at <= 0) return false
  const domain = email.slice(at + 1)
  // Strict-ish: allow .edu (US) and common variants like .edu.tr
  return domain.endsWith('.edu') || domain.includes('.edu.')
}

export function dateOnlyIso(d: Date) {
  const year = d.getFullYear()
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

