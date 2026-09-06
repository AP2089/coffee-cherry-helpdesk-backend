import { describe, expect, it } from 'vitest'
import { validateGuestProfile } from '../services/chat.service'

describe('validateGuestProfile', () => {
  it('normalizes and validates guest profile', () => {
    const profile = validateGuestProfile({
      guestName: '  Ivan  ',
      guestEmail: ' Test@Example.com ',
    })

    expect(profile).toEqual({
      guestName: 'Ivan',
      guestEmail: 'test@example.com',
    })
  })

  it('requires guest name', () => {
    expect(() =>
      validateGuestProfile({
        guestName: ' ',
        guestEmail: 'test@example.com',
      }),
    ).toThrow('Guest name is required')
  })

  it('requires valid email', () => {
    expect(() =>
      validateGuestProfile({
        guestName: 'Ivan',
        guestEmail: 'invalid-email',
      }),
    ).toThrow('Valid guest email is required')
  })
})
