import type { AuditLog, InterestMessage, MeetingRequest, Post, Role, User } from './models'
import { readJson, writeJson } from './storage'
import { dateOnlyIso, nowIso, uid } from './utils'

type Db = {
  users: User[]
  posts: Post[]
  interests: InterestMessage[]
  meetings: MeetingRequest[]
  logs: AuditLog[]
}

const DB_KEY = 'healthai_db_v1'

function emptyDb(): Db {
  return { users: [], posts: [], interests: [], meetings: [], logs: [] }
}

function load(): Db {
  const db = readJson<Db>(DB_KEY, emptyDb())
  if (!db.users?.length) return seedIfEmpty(db)
  return db
}

function save(db: Db) {
  writeJson(DB_KEY, db)
}

function seedIfEmpty(db: Db): Db {
  const at = nowIso()
  const admin: User = {
    id: uid('usr'),
    email: 'admin@demo.edu',
    name: 'Admin',
    role: 'admin',
    verified: true,
    suspended: false,
    createdAt: at,
  }
  const engineer: User = {
    id: uid('usr'),
    email: 'engineer@demo.edu',
    name: 'Demo Engineer',
    role: 'engineer',
    verified: true,
    suspended: false,
    createdAt: at,
  }
  const healthcare: User = {
    id: uid('usr'),
    email: 'doctor@demo.edu',
    name: 'Demo Doctor',
    role: 'healthcare',
    verified: true,
    suspended: false,
    createdAt: at,
  }

  const today = new Date()
  const expiry = new Date(today)
  expiry.setDate(expiry.getDate() + 21)

  const post1: Post = {
    id: uid('pst'),
    ownerUserId: engineer.id,
    ownerRole: 'engineer',
    title: 'Cardiology imaging: need clinical workflow feedback',
    expertiseRequired: 'medical',
    workingDomain: 'Cardiology imaging',
    shortExplanation: 'We are prototyping a lightweight imaging triage assistant.',
    desiredExpertise: 'Cardiologist familiar with imaging workflow',
    commitmentLevel: '1 meeting + async Q&A',
    highLevelIdea: 'High-level only; details in meeting.',
    collaborationType: 'advisor',
    confidentialityLevel: 'meeting_only',
    expiryDate: dateOnlyIso(expiry),
    autoClose: true,
    projectStage: 'concept_validation',
    country: 'Turkey',
    city: 'Ankara',
    status: 'active',
    createdAt: at,
    updatedAt: at,
    lifecycle: [{ at, byUserId: engineer.id, to: 'active' }],
  }

  const post2: Post = {
    id: uid('pst'),
    ownerUserId: healthcare.id,
    ownerRole: 'healthcare',
    title: 'Need an engineer for a simple patient follow-up app idea',
    expertiseRequired: 'engineering',
    workingDomain: 'Chronic disease management',
    shortExplanation: 'Follow-up reminders + simple symptom tracking (no patient data stored).',
    desiredExpertise: 'Frontend engineer; basic backend optional',
    commitmentLevel: '2-3 weeks part-time',
    highLevelIdea: 'Public pitch OK; no files shared here.',
    collaborationType: 'research_partner',
    confidentialityLevel: 'public_pitch',
    expiryDate: dateOnlyIso(expiry),
    autoClose: true,
    projectStage: 'idea',
    country: 'Turkey',
    city: 'Istanbul',
    status: 'active',
    createdAt: at,
    updatedAt: at,
    lifecycle: [{ at, byUserId: healthcare.id, to: 'active' }],
  }

  const seeded: Db = {
    ...db,
    users: [admin, engineer, healthcare],
    posts: [post1, post2],
  }
  save(seeded)
  return seeded
}

export const db = {
  get(): Db {
    const db = load()
    // expire posts on read (simple)
    const today = dateOnlyIso(new Date())
    let changed = false
    for (const p of db.posts) {
      if ((p.status === 'active' || p.status === 'draft') && p.expiryDate < today) {
        p.status = 'expired'
        p.updatedAt = nowIso()
        p.lifecycle.push({ at: p.updatedAt, byUserId: p.ownerUserId, to: 'expired' })
        changed = true
      }
    }
    if (changed) save(db)
    return db
  },
  set(next: Db) {
    save(next)
  },
  update(fn: (db: Db) => void) {
    const cur = load()
    fn(cur)
    save(cur)
  },
  reset() {
    save(emptyDb())
  },
  findUser(userId: string) {
    return this.get().users.find((u) => u.id === userId)
  },
  roleLabel(role: Role) {
    if (role === 'engineer') return 'Engineer'
    if (role === 'healthcare') return 'Healthcare Professional'
    return 'Admin'
  },
}

