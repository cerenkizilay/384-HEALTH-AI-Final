import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
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

const codeStore = new Map()

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

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

app.listen(PORT, () => {
  console.log(`Auth API listening on http://localhost:${PORT}`)
})
