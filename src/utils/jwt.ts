import { createHmac, timingSafeEqual } from 'crypto'
import { env } from '../config/env'
import type { UserRole } from '../types'

export interface AuthTokenPayload {
  sub: string
  username: string
  role: UserRole
  exp: number
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url')
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

export function signAuthToken(payload: Omit<AuthTokenPayload, 'exp'>): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = encodeBase64Url(
    JSON.stringify({
      ...payload,
      exp: Date.now() + TOKEN_TTL_MS,
    }),
  )
  const signature = createHmac('sha256', env.jwtSecret)
    .update(`${header}.${body}`)
    .digest('base64url')

  return `${header}.${body}.${signature}`
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token')
  }

  const [header, body, signature] = parts
  const expected = createHmac('sha256', env.jwtSecret)
    .update(`${header}.${body}`)
    .digest('base64url')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('Invalid token signature')
  }

  const payload = JSON.parse(decodeBase64Url(body)) as AuthTokenPayload

  if (!payload.sub || !payload.username || !payload.role || !payload.exp) {
    throw new Error('Invalid token payload')
  }

  if (payload.exp < Date.now()) {
    throw new Error('Token expired')
  }

  return payload
}
