
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import 'dotenv/config'

const JWT_SECRET: string = process.env.JWT_SECRET || ''

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in the .env file')
}

export type AuthUser = {
  userId: number
  role: 'STUDENT' | 'ADMIN'
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required' })
    return
  }

  const token = authorization.slice('Bearer '.length)

  try {
const decoded = jwt.verify(token, JWT_SECRET)

if (
  typeof decoded === 'string' ||
  !('userId' in decoded) ||
  !('role' in decoded)
) {
  res.status(401).json({ error: 'Invalid authentication token' })
  return
}

const payload = decoded as AuthUser
    if (
      !Number.isInteger(payload.userId) ||
      !['STUDENT', 'ADMIN'].includes(payload.role)
    ) {
      res.status(401).json({ error: 'Invalid authentication token' })
      return
    }

    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Administrator access required' })
    return
  }

  next()
}
