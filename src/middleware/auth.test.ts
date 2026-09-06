import { describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { forbidGuest, requireAdmin, requireAuth } from './auth'
import { AppError } from './errorHandler'
import { UserRole } from '../types'
import * as jwt from '../utils/jwt'

describe('auth middleware', () => {
  it('requireAuth rejects missing authorization header', () => {
    const req = { headers: {} } as Request
    const next = vi.fn()

    requireAuth(req, {} as Response, next as NextFunction)

    expect(next).toHaveBeenCalledWith(expect.any(AppError))
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401)
  })

  it('requireAuth attaches auth payload for valid token', () => {
    vi.spyOn(jwt, 'verifyAuthToken').mockReturnValue({
      sub: '1',
      username: 'admin',
      role: UserRole.Admin,
      exp: Date.now() + 1000,
    })

    const req = { headers: { authorization: 'Bearer token' } } as Request
    const next = vi.fn()

    requireAuth(req, {} as Response, next as NextFunction)

    expect(req.auth?.username).toBe('admin')
    expect(next).toHaveBeenCalledWith()
  })

  it('requireAdmin rejects non-admin role', () => {
    const req = {
      auth: {
        sub: '1',
        username: 'manager',
        role: UserRole.Manager,
        exp: Date.now() + 1000,
      },
    } as Request
    const next = vi.fn()

    requireAdmin(req, {} as Response, next as NextFunction)

    expect(next).toHaveBeenCalledWith(expect.any(AppError))
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(403)
  })

  it('requireAdmin passes for admin role', () => {
    const req = {
      auth: {
        sub: '1',
        username: 'admin',
        role: UserRole.Admin,
        exp: Date.now() + 1000,
      },
    } as Request
    const next = vi.fn()

    requireAdmin(req, {} as Response, next as NextFunction)

    expect(next).toHaveBeenCalledWith()
  })

  it('forbidGuest rejects guest role', () => {
    const req = {
      auth: {
        sub: '3',
        username: 'guest',
        role: UserRole.Guest,
        exp: Date.now() + 1000,
      },
    } as Request
    const next = vi.fn()

    forbidGuest(req, {} as Response, next as NextFunction)

    expect(next).toHaveBeenCalledWith(expect.any(AppError))
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(403)
    expect((next.mock.calls[0][0] as AppError).message).toBe('У вас нет прав для редактирования')
  })

  it('forbidGuest rejects guest username even with manager role', () => {
    const req = {
      auth: {
        sub: '3',
        username: 'guest',
        role: UserRole.Manager,
        exp: Date.now() + 1000,
      },
    } as Request
    const next = vi.fn()

    forbidGuest(req, {} as Response, next as NextFunction)

    expect(next).toHaveBeenCalledWith(expect.any(AppError))
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(403)
  })

  it('forbidGuest passes for non-guest users', () => {
    const req = {
      auth: {
        sub: '2',
        username: 'manager',
        role: UserRole.Manager,
        exp: Date.now() + 1000,
      },
    } as Request
    const next = vi.fn()

    forbidGuest(req, {} as Response, next as NextFunction)

    expect(next).toHaveBeenCalledWith()
  })
})
