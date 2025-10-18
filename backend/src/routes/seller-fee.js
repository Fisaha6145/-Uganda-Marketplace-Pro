
import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { prisma } from '../index.js'

const r = Router()
const REG_FEE = Number(process.env.REGISTRATION_FEE_UGX || 25000)

r.post('/sellers/me/fee/initiate', auth, async (req,res)=>{
  const payment = await prisma.payment.create({
    data:{
      userId: req.user.id,
      purpose: 'SELLER_REGISTRATION',
      amountUGX: REG_FEE,
      provider: 'mock',
      status: 'PENDING'
    }
  })
  const authorizationUrl = `/mockpay/checkout/${payment.id}`
  res.json({ paymentId: payment.id, amountUGX: REG_FEE, authorizationUrl })
})

r.post('/mockpay/complete/:paymentId', async (req,res)=>{
  const p = await prisma.payment.update({
    where:{ id: req.params.paymentId },
    data:{ status:'PAID', provider:'mock', providerRef: `mock-${req.params.paymentId}` }
  })
  const seller = await prisma.seller.findFirst({ where:{ userId: p.userId } })
  if(seller){
    await prisma.$transaction(async (tx)=>{
      await tx.seller.update({ where:{ id:seller.id }, data:{ status:'PENDING_VERIFICATION' } })
      await tx.sellerRegFee.create({ data:{ sellerId: seller.id, paymentId: p.id, amountUGX: p.amountUGX, paidAt: new Date() } })
    })
  }
  res.json({ ok:true })
})

export default r
