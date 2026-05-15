import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import pkg from 'pg'

const { Pool } = pkg

dotenv.config()

const app = express()
app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json())

const PORT = Number(process.env.PORT || 4000)
const SMTP_USER = (process.env.SMTP_USER || '').trim()
const SMTP_PASS = (process.env.SMTP_PASS || '').trim()
const CODE_TTL_MS = 10 * 60 * 1000

if (!SMTP_USER || !SMTP_PASS) {
  console.warn('SMTP_USER or SMTP_PASS is missing. Email verification will not work until env vars are set.')
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

// ─── PostgreSQL ───────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL || ''

let pool = null

if (DATABASE_URL) {
  const sslNeeded = DATABASE_URL.includes('render.com') || DATABASE_URL.includes('postgres')
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: sslNeeded ? { rejectUnauthorized: false } : undefined,
  })
} else {
  console.warn('DATABASE_URL is not set. DB endpoints will not work. OTP endpoints still active.')
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    verified: row.verified,
    suspended: row.suspended,
    createdAt: row.created_at,
  }
}

function mapPost(row) {
  if (!row) return null
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    ownerRole: row.owner_role,
    title: row.title,
    expertiseRequired: row.expertise_required,
    workingDomain: row.working_domain,
    shortExplanation: row.short_explanation,
    desiredExpertise: row.desired_expertise,
    commitmentLevel: row.commitment_level,
    highLevelIdea: row.high_level_idea,
    collaborationType: row.collaboration_type,
    confidentialityLevel: row.confidentiality_level,
    expiryDate: row.expiry_date,
    autoClose: row.auto_close,
    projectStage: row.project_stage,
    country: row.country,
    city: row.city,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lifecycle: row.lifecycle ?? [],
  }
}

function mapMeeting(row) {
  if (!row) return null
  return {
    id: row.id,
    postId: row.post_id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    ndaAccepted: row.nda_accepted,
    proposedSlots: row.proposed_slots ?? [],
    selectedSlot: row.selected_slot,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapChat(row) {
  if (!row) return null
  return {
    id: row.id,
    meetingId: row.meeting_id,
    fromUserId: row.from_user_id,
    text: row.text,
    createdAt: row.created_at,
  }
}

function mapInterest(row) {
  if (!row) return null
  return {
    id: row.id,
    postId: row.post_id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    message: row.message,
    createdAt: row.created_at,
  }
}

function mapAudit(row) {
  if (!row) return null
  return {
    id: row.id,
    at: row.at,
    userId: row.user_id,
    role: row.role,
    actionType: row.action_type,
    targetEntity: row.target_entity,
    result: row.result,
    details: row.details,
  }
}

// ─── DB Init ──────────────────────────────────────────────────────────────────

async function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
}

function nowIso() {
  return new Date().toISOString()
}

function dateOnlyIso(d) {
  const year = d.getFullYear()
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function initDb() {
  if (!pool) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      suspended BOOLEAN DEFAULT FALSE,
      created_at TEXT NOT NULL
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      owner_role TEXT NOT NULL,
      title TEXT NOT NULL,
      expertise_required TEXT NOT NULL,
      working_domain TEXT NOT NULL,
      short_explanation TEXT NOT NULL,
      desired_expertise TEXT NOT NULL,
      commitment_level TEXT NOT NULL,
      high_level_idea TEXT,
      collaboration_type TEXT NOT NULL,
      confidentiality_level TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      auto_close BOOLEAN DEFAULT TRUE,
      project_stage TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      lifecycle JSONB DEFAULT '[]'
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      nda_accepted BOOLEAN DEFAULT TRUE,
      proposed_slots JSONB DEFAULT '[]',
      selected_slot TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interests (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      at TEXT NOT NULL,
      user_id TEXT,
      role TEXT,
      action_type TEXT NOT NULL,
      target_entity TEXT,
      result TEXT NOT NULL,
      details TEXT
    );
  `)

  // Seed if empty
  const { rows: existingUsers } = await pool.query('SELECT id FROM users LIMIT 1')
  if (existingUsers.length === 0) {
    await seedDb()
  }

  console.log('DB initialized.')
}

async function seedDb() {
  const at = nowIso()

  const adminId = await uid('usr')
  const engineerId = await uid('usr')
  const healthcareId = await uid('usr')

  await pool.query(
    'INSERT INTO users (id, email, name, role, verified, suspended, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [adminId, 'admin@demo.edu', 'Admin', 'admin', true, false, at],
  )
  await pool.query(
    'INSERT INTO users (id, email, name, role, verified, suspended, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [engineerId, 'engineer@demo.edu', 'Demo Engineer', 'engineer', true, false, at],
  )
  await pool.query(
    'INSERT INTO users (id, email, name, role, verified, suspended, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [healthcareId, 'doctor@demo.edu', 'Demo Doctor', 'healthcare', true, false, at],
  )

  const today = new Date()
  const expiry = new Date(today)
  expiry.setDate(expiry.getDate() + 21)
  const expiryDate = dateOnlyIso(expiry)

  const post1Id = await uid('pst')
  const post1Lifecycle = JSON.stringify([{ at, byUserId: engineerId, to: 'active' }])
  await pool.query(
    `INSERT INTO posts (id, owner_user_id, owner_role, title, expertise_required, working_domain,
      short_explanation, desired_expertise, commitment_level, high_level_idea, collaboration_type,
      confidentiality_level, expiry_date, auto_close, project_stage, country, city, status,
      created_at, updated_at, lifecycle)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      post1Id, engineerId, 'engineer',
      'Cardiology imaging: need clinical workflow feedback',
      'medical', 'Cardiology imaging',
      'We are prototyping a lightweight imaging triage assistant.',
      'Cardiologist familiar with imaging workflow',
      '1 meeting + async Q&A',
      'High-level only; details in meeting.',
      'advisor', 'meeting_only',
      expiryDate, true, 'concept_validation',
      'Turkey', 'Ankara', 'active',
      at, at, post1Lifecycle,
    ],
  )

  const post2Id = await uid('pst')
  const post2Lifecycle = JSON.stringify([{ at, byUserId: healthcareId, to: 'active' }])
  await pool.query(
    `INSERT INTO posts (id, owner_user_id, owner_role, title, expertise_required, working_domain,
      short_explanation, desired_expertise, commitment_level, high_level_idea, collaboration_type,
      confidentiality_level, expiry_date, auto_close, project_stage, country, city, status,
      created_at, updated_at, lifecycle)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      post2Id, healthcareId, 'healthcare',
      'Need an engineer for a simple patient follow-up app idea',
      'engineering', 'Chronic disease management',
      'Follow-up reminders + simple symptom tracking (no patient data stored).',
      'Frontend engineer; basic backend optional',
      '2-3 weeks part-time',
      'Public pitch OK; no files shared here.',
      'research_partner', 'public_pitch',
      expiryDate, true, 'idea',
      'Turkey', 'Istanbul', 'active',
      at, at, post2Lifecycle,
    ],
  )

  console.log('DB seeded with demo data.')
}

// ─── OTP store ────────────────────────────────────────────────────────────────

const codeStore = new Map()

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// ─── OTP endpoints ────────────────────────────────────────────────────────────

app.post('/auth/send-code', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ message: 'Email is required.' })

    const code = generateCode()
    const expiresAt = Date.now() + CODE_TTL_MS
    codeStore.set(email, { code, expiresAt })

    if (!SMTP_USER || !SMTP_PASS) {
      return res.status(500).json({ message: 'SMTP settings are missing in backend environment.' })
    }

    await transporter.sendMail({
      from: `"Health AI Verify" <${SMTP_USER}>`,
      to: email,
      subject: 'Your Health AI verification code',
      text: `Your verification code is: ${code}\nThis code expires in 10 minutes.`,
      html: `<p>Your verification code is:</p><h2 style="letter-spacing:2px">${code}</h2><p>This code expires in 10 minutes.</p>`,
    })

    return res.json({ message: 'Verification code sent.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Failed to send verification code.' })
  }
})

app.post('/auth/verify-code', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const code = String(req.body?.code || '').trim()
  if (!email || !code) return res.status(400).json({ message: 'Email and code are required.' })

  const entry = codeStore.get(email)
  if (!entry) return res.status(400).json({ message: 'No verification code found for this email.' })
  if (Date.now() > entry.expiresAt) {
    codeStore.delete(email)
    return res.status(400).json({ message: 'Verification code expired. Please request a new one.' })
  }
  if (entry.code !== code) return res.status(400).json({ message: 'Invalid verification code.' })

  codeStore.delete(email)
  return res.json({ message: 'Email verified.' })
})

// ─── DB middleware guard ──────────────────────────────────────────────────────

function requireDb(req, res, next) {
  if (!pool) return res.status(503).json({ message: 'Database not configured.' })
  next()
}

// ─── Users ────────────────────────────────────────────────────────────────────

app.get('/api/users', requireDb, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC')
    res.json(rows.map(mapUser))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch users.' })
  }
})

// IMPORTANT: /api/users/by-email/:email must come BEFORE /api/users/:id
app.get('/api/users/by-email/:email', requireDb, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).trim().toLowerCase()
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (rows.length === 0) return res.json(null)
    res.json(mapUser(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch user.' })
  }
})

app.get('/api/users/:id', requireDb, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' })
    res.json(mapUser(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch user.' })
  }
})

app.post('/api/users', requireDb, async (req, res) => {
  try {
    const u = req.body
    await pool.query(
      'INSERT INTO users (id, email, name, role, verified, suspended, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [u.id, u.email, u.name, u.role, u.verified ?? false, u.suspended ?? false, u.createdAt],
    )
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [u.id])
    res.status(201).json(mapUser(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create user.' })
  }
})

app.put('/api/users/:id', requireDb, async (req, res) => {
  try {
    const patch = req.body
    const allowed = ['email', 'name', 'role', 'verified', 'suspended']
    const sets = []
    const vals = []
    let idx = 1
    for (const key of allowed) {
      if (key in patch) {
        const colMap = { email: 'email', name: 'name', role: 'role', verified: 'verified', suspended: 'suspended' }
        sets.push(`${colMap[key]} = $${idx}`)
        vals.push(patch[key])
        idx++
      }
    }
    if (sets.length === 0) return res.status(400).json({ message: 'Nothing to update.' })
    vals.push(req.params.id)
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, vals)
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' })
    res.json(mapUser(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update user.' })
  }
})

// ─── Posts ────────────────────────────────────────────────────────────────────

async function autoExpirePosts() {
  if (!pool) return
  const today = dateOnlyIso(new Date())
  await pool.query(
    `UPDATE posts SET status = 'expired', updated_at = $1
     WHERE (status = 'active' OR status = 'draft') AND expiry_date < $2`,
    [nowIso(), today],
  )
}

app.get('/api/posts', requireDb, async (_req, res) => {
  try {
    await autoExpirePosts()
    const { rows } = await pool.query('SELECT * FROM posts ORDER BY updated_at DESC')
    res.json(rows.map(mapPost))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch posts.' })
  }
})

app.get('/api/posts/user/:userId', requireDb, async (req, res) => {
  try {
    await autoExpirePosts()
    const { rows } = await pool.query(
      'SELECT * FROM posts WHERE owner_user_id = $1 ORDER BY updated_at DESC',
      [req.params.userId],
    )
    res.json(rows.map(mapPost))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch posts.' })
  }
})

app.get('/api/posts/:id', requireDb, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Post not found.' })
    res.json(mapPost(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch post.' })
  }
})

app.post('/api/posts', requireDb, async (req, res) => {
  try {
    const p = req.body
    await pool.query(
      `INSERT INTO posts (id, owner_user_id, owner_role, title, expertise_required, working_domain,
        short_explanation, desired_expertise, commitment_level, high_level_idea, collaboration_type,
        confidentiality_level, expiry_date, auto_close, project_stage, country, city, status,
        created_at, updated_at, lifecycle)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [
        p.id, p.ownerUserId, p.ownerRole, p.title, p.expertiseRequired, p.workingDomain,
        p.shortExplanation, p.desiredExpertise, p.commitmentLevel, p.highLevelIdea ?? null,
        p.collaborationType, p.confidentialityLevel, p.expiryDate, p.autoClose ?? true,
        p.projectStage, p.country, p.city, p.status, p.createdAt, p.updatedAt,
        JSON.stringify(p.lifecycle ?? []),
      ],
    )
    const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [p.id])
    res.status(201).json(mapPost(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create post.' })
  }
})

app.put('/api/posts/:id', requireDb, async (req, res) => {
  try {
    const patch = req.body
    const colMap = {
      title: 'title',
      expertiseRequired: 'expertise_required',
      workingDomain: 'working_domain',
      shortExplanation: 'short_explanation',
      desiredExpertise: 'desired_expertise',
      commitmentLevel: 'commitment_level',
      highLevelIdea: 'high_level_idea',
      collaborationType: 'collaboration_type',
      confidentialityLevel: 'confidentiality_level',
      expiryDate: 'expiry_date',
      autoClose: 'auto_close',
      projectStage: 'project_stage',
      country: 'country',
      city: 'city',
      status: 'status',
      updatedAt: 'updated_at',
      lifecycle: 'lifecycle',
    }
    const sets = []
    const vals = []
    let idx = 1
    for (const [jsKey, col] of Object.entries(colMap)) {
      if (jsKey in patch) {
        const val = jsKey === 'lifecycle' ? JSON.stringify(patch[jsKey]) : patch[jsKey]
        sets.push(`${col} = $${idx}`)
        vals.push(val)
        idx++
      }
    }
    if (sets.length === 0) return res.status(400).json({ message: 'Nothing to update.' })
    vals.push(req.params.id)
    await pool.query(`UPDATE posts SET ${sets.join(', ')} WHERE id = $${idx}`, vals)
    const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Post not found.' })
    res.json(mapPost(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update post.' })
  }
})

app.delete('/api/posts/:id', requireDb, async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete post.' })
  }
})

// ─── Meetings ─────────────────────────────────────────────────────────────────

app.get('/api/meetings/post/:postId', requireDb, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM meetings WHERE post_id = $1 ORDER BY created_at DESC',
      [req.params.postId],
    )
    res.json(rows.map(mapMeeting))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch meetings.' })
  }
})

app.get('/api/meetings/user/:userId', requireDb, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM meetings WHERE from_user_id = $1 OR to_user_id = $1 ORDER BY created_at DESC',
      [req.params.userId],
    )
    res.json(rows.map(mapMeeting))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch meetings.' })
  }
})

app.post('/api/meetings', requireDb, async (req, res) => {
  try {
    const m = req.body
    await pool.query(
      `INSERT INTO meetings (id, post_id, from_user_id, to_user_id, nda_accepted, proposed_slots,
        selected_slot, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        m.id, m.postId, m.fromUserId, m.toUserId, m.ndaAccepted ?? true,
        JSON.stringify(m.proposedSlots ?? []), m.selectedSlot ?? null,
        m.status, m.createdAt, m.updatedAt,
      ],
    )
    const { rows } = await pool.query('SELECT * FROM meetings WHERE id = $1', [m.id])
    res.status(201).json(mapMeeting(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create meeting.' })
  }
})

app.put('/api/meetings/:id', requireDb, async (req, res) => {
  try {
    const patch = req.body
    const colMap = {
      status: 'status',
      selectedSlot: 'selected_slot',
      updatedAt: 'updated_at',
      ndaAccepted: 'nda_accepted',
      proposedSlots: 'proposed_slots',
    }
    const sets = []
    const vals = []
    let idx = 1
    for (const [jsKey, col] of Object.entries(colMap)) {
      if (jsKey in patch) {
        const val = jsKey === 'proposedSlots' ? JSON.stringify(patch[jsKey]) : patch[jsKey]
        sets.push(`${col} = $${idx}`)
        vals.push(val)
        idx++
      }
    }
    if (sets.length === 0) return res.status(400).json({ message: 'Nothing to update.' })
    vals.push(req.params.id)
    await pool.query(`UPDATE meetings SET ${sets.join(', ')} WHERE id = $${idx}`, vals)
    const { rows } = await pool.query('SELECT * FROM meetings WHERE id = $1', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Meeting not found.' })
    res.json(mapMeeting(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update meeting.' })
  }
})

// ─── Chats ────────────────────────────────────────────────────────────────────

app.get('/api/chats/:meetingId', requireDb, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM chats WHERE meeting_id = $1 ORDER BY created_at ASC',
      [req.params.meetingId],
    )
    res.json(rows.map(mapChat))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch messages.' })
  }
})

app.post('/api/chats', requireDb, async (req, res) => {
  try {
    const msg = req.body
    // Validate that the meeting exists and is accepted
    const { rows: meetingRows } = await pool.query('SELECT * FROM meetings WHERE id = $1', [msg.meetingId])
    if (meetingRows.length === 0) return res.status(404).json({ message: 'Meeting not found.' })
    const meeting = meetingRows[0]
    if (meeting.status !== 'accepted') return res.status(403).json({ message: 'Chat is only available for accepted meetings.' })
    const isParty = meeting.from_user_id === msg.fromUserId || meeting.to_user_id === msg.fromUserId
    if (!isParty) return res.status(403).json({ message: 'You do not have access to this chat.' })

    await pool.query(
      'INSERT INTO chats (id, meeting_id, from_user_id, text, created_at) VALUES ($1,$2,$3,$4,$5)',
      [msg.id, msg.meetingId, msg.fromUserId, msg.text, msg.createdAt],
    )
    const { rows } = await pool.query('SELECT * FROM chats WHERE id = $1', [msg.id])
    res.status(201).json(mapChat(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to send message.' })
  }
})

// ─── Interests ────────────────────────────────────────────────────────────────

app.post('/api/interests', requireDb, async (req, res) => {
  try {
    const i = req.body
    await pool.query(
      'INSERT INTO interests (id, post_id, from_user_id, to_user_id, message, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [i.id, i.postId, i.fromUserId, i.toUserId, i.message, i.createdAt],
    )
    const { rows } = await pool.query('SELECT * FROM interests WHERE id = $1', [i.id])
    res.status(201).json(mapInterest(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create interest.' })
  }
})

app.get('/api/interests/post/:postId', requireDb, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM interests WHERE post_id = $1 ORDER BY created_at DESC',
      [req.params.postId],
    )
    res.json(rows.map(mapInterest))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch interests.' })
  }
})

// ─── Audit ────────────────────────────────────────────────────────────────────

app.get('/api/audit', requireDb, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY at DESC LIMIT 2000')
    res.json(rows.map(mapAudit))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch audit logs.' })
  }
})

app.post('/api/audit', requireDb, async (req, res) => {
  try {
    const log = req.body
    await pool.query(
      `INSERT INTO audit_logs (id, at, user_id, role, action_type, target_entity, result, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        log.id, log.at, log.userId ?? null, log.role ?? null,
        log.actionType, log.targetEntity ?? null, log.result, log.details ?? null,
      ],
    )
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create audit log.' })
  }
})

// ─── Start ────────────────────────────────────────────────────────────────────

if (pool) {
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Auth API listening on http://localhost:${PORT}`)
      })
    })
    .catch((err) => {
      console.error('DB init failed:', err)
      app.listen(PORT, () => {
        console.log(`Auth API listening on http://localhost:${PORT} (DB init failed)`)
      })
    })
} else {
  app.listen(PORT, () => {
    console.log(`Auth API listening on http://localhost:${PORT} (no DB)`)
  })
}
