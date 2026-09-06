import type { NextFunction, Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { AppError } from '../middleware/errorHandler'

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    const result = await authService.login(username, password)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError('Unauthorized', 401)
    }

    res.json({
      success: true,
      data: {
        username: req.auth.username,
        role: req.auth.role,
      },
    })
  } catch (error) {
    next(error)
  }
}
