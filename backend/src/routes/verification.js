
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { auth } from '../middleware/auth.js'
import { prisma } from '../index.js'

const upload = multer({ dest: process.env.UPLOAD_DIR || path.join(process.cwd(),'uploads') })
const r = Router()

r.post('/sellers/me/verification', auth, upload.fields([
  { name:'tradingLicense', maxCount:1 },
  { name:'nationalId', maxCount:1 }
]), async (req,res)=>{
  const seller = await prisma.seller.findFirst({ where:{ userId: req.user.id } })
  if(!seller) return res.status(404).json({ error:'SELLER_NOT_FOUND' })
  if(!req.files || (!req.files.tradingLicense && !req.files.nationalId))
    return res.status(400).json({ error:'NO_FILES' })
  const docs = []
  if(req.files.tradingLicense){
    const f = req.files.tradingLicense[0]; docs.push({ sellerId: seller.id, kind:'TRADING_LICENSE', url:`/files/${f.filename}` })
  }
  if(req.files.nationalId){
    const f = req.files.nationalId[0]; docs.push({ sellerId: seller.id, kind:'NATIONAL_ID', url:`/files/${f.filename}` })
  }
  await prisma.verificationDoc.createMany({ data: docs })
  res.json({ ok:true })
})

export default r
