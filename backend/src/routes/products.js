
import { Router } from 'express'
import { auth, requireActiveSeller } from '../middleware/auth.js'
import { prisma } from '../index.js'

const r = Router()

function normalizeUgNumber(input){
  if(!input) return null;
  let n = String(input).replace(/[^\d+]/g,'');
  if(/^0\d{8,}$/.test(n)) n = '+256' + n.slice(1);
  if(/^\d{9,12}$/.test(n)) n = '+256' + n;
  if(!/^\+\d{9,15}$/.test(n)) return null;
  return n;
}
function toWhatsAppLink(e164, text){
  if(!e164) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${e164.replace('+','')}${q}`;
}
function toTelLink(e164){ return e164 ? `tel:${e164}` : null; }

// Public browse
r.get('/products', async (req,res)=>{
  const { q, category, min, max } = req.query
  const where = { status:'active' }
  if(category) where.category = String(category)
  if(min) where.priceUGX = { ...(where.priceUGX||{}), gte: Number(min) }
  if(max) where.priceUGX = { ...(where.priceUGX||{}), lte: Number(max) }
  if(q){
    where.OR = [
      { name: { contains: String(q), mode:'insensitive' } },
      { description: { contains: String(q), mode:'insensitive' } }
    ]
  }
  const items = await prisma.product.findMany({ where, orderBy:{ createdAt:'desc' } })
  const mapped = items.map(p => ({
    ...p,
    whatsappLink: p.showContact ? toWhatsAppLink(p.whatsappE164, `Hi, I'm interested in ${p.name}`) : null,
    phoneLink: p.showContact ? toTelLink(p.phoneE164) : null,
  }))
  res.json(mapped)
})

// Seller CRUD (ACTIVE)
r.post('/seller/products', auth, requireActiveSeller, async (req,res)=>{
  const { name, description, category, priceUGX, stock, whatsapp, phone, showContact = true } = req.body
  if(!name || !category || priceUGX==null) return res.status(400).json({ error:'MISSING_FIELDS' })
  const p = await prisma.product.create({
    data:{ sellerId: req.seller.id, name, description, category,
      priceUGX: Number(priceUGX), stock: Number(stock||0),
      whatsappE164: normalizeUgNumber(whatsapp),
      phoneE164: normalizeUgNumber(phone),
      showContact: !!showContact
    }
  })
  res.json(p)
})

r.put('/seller/products/:id', auth, requireActiveSeller, async (req,res)=>{
  const p = await prisma.product.findUnique({ where:{ id: req.params.id } })
  if(!p || p.sellerId !== req.seller.id) return res.status(404).json({ error:'NOT_FOUND' })
  const data = { ...req.body }
  if('whatsapp' in req.body) data.whatsappE164 = normalizeUgNumber(req.body.whatsapp);
  if('phone' in req.body) data.phoneE164 = normalizeUgNumber(req.body.phone);
  if('showContact' in req.body) data.showContact = !!req.body.showContact;
  const updated = await prisma.product.update({ where:{ id:p.id }, data })
  res.json(updated)
})

r.delete('/seller/products/:id', auth, requireActiveSeller, async (req,res)=>{
  const p = await prisma.product.findUnique({ where:{ id: req.params.id } })
  if(!p || p.sellerId !== req.seller.id) return res.status(404).json({ error:'NOT_FOUND' })
  await prisma.product.update({ where:{ id:p.id }, data:{ status:'inactive' } })
  res.json({ ok:true })
})

export default r
