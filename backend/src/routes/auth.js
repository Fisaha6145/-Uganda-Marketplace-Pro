
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const prisma = new PrismaClient()
const r = Router()

const registerSchema = z.object({
  role: z.enum(['BUYER','SELLER']).default('BUYER'),
  email: z.string().email(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(6),
  businessName: z.string().min(2).max(120).optional()
})

r.post('/register', async (req,res)=>{
  const parsed = registerSchema.safeParse(req.body)
  if(!parsed.success) return res.status(400).json({ error:'INVALID_INPUT', details: parsed.error.flatten() })
  const { role, email, phone, password, businessName } = parsed.data
  const exists = await prisma.user.findUnique({ where:{ email } })
  if(exists) return res.status(409).json({ error:'EMAIL_IN_USE' })
  const passwordHash = await argon2.hash(password)
  const user = await prisma.user.create({
    data:{ role, email, phone, passwordHash, emailVerifiedAt: new Date() } // demo auto-verify
  })
  if(role === 'SELLER'){
    await prisma.seller.create({
      data:{ userId: user.id, businessName: businessName || 'Business', status: 'PENDING_PAYMENT' }
    })
  }
  const token = jwt.sign({ id:user.id, role:user.role, email:user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user:{ id:user.id, role:user.role, email:user.email } })
})

const loginSchema = z.object({ email: z.string().email(), password: z.string() })
r.post('/login', async (req,res)=>{
  const parsed = loginSchema.safeParse(req.body)
  if(!parsed.success) return res.status(400).json({ error:'INVALID_INPUT' })
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where:{ email } })
  if(!user) return res.status(401).json({ error:'INVALID_CREDENTIALS' })
  const ok = await argon2.verify(user.passwordHash, password)
  if(!ok) return res.status(401).json({ error:'INVALID_CREDENTIALS' })
  const token = jwt.sign({ id:user.id, role:user.role, email:user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user:{ id:user.id, role:user.role, email:user.email } })
})

export default r
