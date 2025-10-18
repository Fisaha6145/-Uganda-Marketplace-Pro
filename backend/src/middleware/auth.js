
import jwt from 'jsonwebtoken'
import { prisma } from '../index.js'

export function auth(req,res,next){
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if(!token) return res.status(401).json({ error:'UNAUTHENTICATED' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch(e){
    return res.status(401).json({ error:'INVALID_TOKEN' })
  }
}

export function requireRole(...roles){
  return (req,res,next)=> {
    if(!req.user) return res.status(401).json({ error:'UNAUTHENTICATED' })
    return roles.includes(req.user.role) ? next() : res.status(403).json({ error:'FORBIDDEN' })
  }
}

export async function requireActiveSeller(req,res,next){
  const userId = req.user?.id
  if(!userId) return res.status(401).json({ error:'UNAUTHENTICATED' })
  const seller = await prisma.seller.findUnique({ where:{ userId } })
  if(!seller) return res.status(404).json({ error:'SELLER_NOT_FOUND' })
  if(seller.status !== 'ACTIVE') return res.status(403).json({ code:'SELLER_NOT_ACTIVE', message:'Complete fee & verification.' })
  req.seller = seller
  next()
}
