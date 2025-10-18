
import { Router } from 'express'
import { auth, requireRole } from '../middleware/auth.js'
import { prisma } from '../index.js'

const r = Router()
r.use(auth, requireRole('ADMIN'))

r.get('/sellers/pending', async (req,res)=>{
  const list = await prisma.seller.findMany({ where:{ status:{ in:['PENDING_VERIFICATION','PENDING_PAYMENT'] }}, include:{ user:true, docs:true } })
  res.json(list)
})

r.post('/sellers/:id/approve', async (req,res)=>{
  const s = await prisma.seller.update({ where:{ id: req.params.id }, data:{ status:'ACTIVE', verifiedAt:new Date() } })
  res.json(s)
})

r.post('/sellers/:id/reject', async (req,res)=>{
  const s = await prisma.seller.update({ where:{ id: req.params.id }, data:{ status:'REJECTED' } })
  res.json(s)
})

r.get('/payments', async (req,res)=>{
  const list = await prisma.payment.findMany({ orderBy:{ createdAt:'desc' } })
  res.json(list)
})

export default r
