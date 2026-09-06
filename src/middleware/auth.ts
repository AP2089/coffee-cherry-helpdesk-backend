import type { NextFunction, Request, Response } from 'express'
import { AppError } from './errorHandler'
import { verifyAuthToken, type AuthTokenPayload } from '../utils/jwt'
import { UserRole } from '../types'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthTokenPayload
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    next(new AppError('Unauthorized', 401))
    return
  }

  const token = header.slice('Bearer '.length).trim()

  try {
    req.auth = verifyAuthToken(token)
    next()
  } catch {
    next(new AppError('Unauthorized', 401))
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(new AppError('Unauthorized', 401))
    return
  }

  if (req.auth.role !== UserRole.Admin) {
    next(new AppError('Forbidden', 403))
    return
  }

  next()
}

/** Guest account is read-only in CRM / Helpdesk. */
export function forbidGuest(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(new AppError('Unauthorized', 401))
    return
  }

  if (req.auth.role === UserRole.Guest || req.auth.username === 'guest') {
    next(new AppError('У вас нет прав для редактирования', 403))
    return
  }

  next()
}
