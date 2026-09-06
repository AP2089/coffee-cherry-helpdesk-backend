import { describe, expect, it } from 'vitest'
import { UserRole } from '../types'
import { signAuthToken, verifyAuthToken } from './jwt'

describe('jwt', () => {
  it('signs and verifies a valid token', () => {
    const token = signAuthToken({
      sub: 'user-id',
      username: 'admin',
      role: UserRole.Admin,
    })

    const payload = verifyAuthToken(token)

    expect(payload.sub).toBe('user-id')
    expect(payload.username).toBe('admin')
    expect(payload.role).toBe(UserRole.Admin)
    expect(payload.exp).toBeGreaterThan(Date.now())
  })

  it('rejects malformed token', () => {
    expect(() => verifyAuthToken('invalid')).toThrow('Invalid token')
  })

  it('rejects token with invalid signature', () => {
    const token = signAuthToken({
      sub: 'user-id',
      username: 'admin',
      role: UserRole.Admin,
    })

    expect(() => verifyAuthToken(`${token}x`)).toThrow('Invalid token signature')
  })
})
