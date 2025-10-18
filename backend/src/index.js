
import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

import authRoutes from './routes/auth.js'
import sellerFeeRoutes from './routes/seller-fee.js'
import verificationRoutes from './routes/verification.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import adminRoutes from './routes/admin.js'

const app = express()
export const prisma = new PrismaClient()

const PORT = process.env.PORT || 8080
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

app.use(helmet())
app.use(morgan('dev'))
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','), credentials: true }))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/files', express.static(UPLOAD_DIR))

const limiter = rateLimit({ windowMs: 15*60*1000, max: 500 })
app.use(limiter)

app.use('/auth', authRoutes)
app.use('/', sellerFeeRoutes)
app.use('/', verificationRoutes)
app.use('/', productRoutes)
app.use('/', orderRoutes)
app.use('/admin', adminRoutes)

app.get('/health', (_,res)=> res.json({ ok:true }))

app.use((err,req,res,next)=>{
  console.error(err)
  res.status(500).json({ error: 'SERVER_ERROR', details: err.message })
})

app.listen(PORT, ()=> console.log(`API running on :${PORT}`))
