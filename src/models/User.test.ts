import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../models/User'

describe('User password helpers', () => {
  it('hashes and verifies password', () => {
    const hash = hashPassword('secret')

    expect(hash).toContain(':')
    expect(verifyPassword('secret', hash)).toBe(true)
    expect(verifyPassword('wrong', hash)).toBe(false)
  })
})
