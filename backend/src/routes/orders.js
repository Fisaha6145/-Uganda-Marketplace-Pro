
import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { prisma } from '../index.js'

const r = Router()

r.post('/orders', auth, async (req,res)=>{
  const { items } = req.body
  if(!Array.isArray(items) || items.length===0) return res.status(400).json({ error:'EMPTY_CART' })
  const ids = items.map(i=>i.productId)
  const prods = await prisma.product.findMany({ where:{ id: { in: ids }, status:'active' } })
  if(prods.length !== items.length) return res.status(400).json({ error:'INVALID_PRODUCTS' })
  let total = 0
  for(const it of items){
    const p = prods.find(x=>x.id===it.productId)
    if(p.stock < it.qty) return res.status(400).json({ error:'OUT_OF_STOCK', productId:p.id })
    total += p.priceUGX * it.qty
  }
  const order = await prisma.$transaction(async tx=>{
    const o = await tx.order.create({ data:{ buyerId: req.user.id, totalUGX: total, status:'PLACED' } })
    for(const it of items){
      const p = prods.find(x=>x.id===it.productId)
      await tx.orderItem.create({ data:{ orderId: o.id, productId: p.id, qty: it.qty, priceUGX: p.priceUGX } })
      await tx.product.update({ where:{ id:p.id }, data:{ stock: p.stock - it.qty } })
    }
    return o
  })
  res.json({ order })
})

r.get('/orders/mine', auth, async (req,res)=>{
  const list = await prisma.order.findMany({ where:{ buyerId: req.user.id }, orderBy:{ createdAt:'desc' }, include:{ items:true } })
  res.json(list)
})

export default r
