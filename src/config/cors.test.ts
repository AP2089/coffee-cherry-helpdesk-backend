import { describe, expect, it } from 'vitest'
import { resolveCorsOrigin } from './cors'

describe('resolveCorsOrigin', () => {
  it('returns true for wildcard', () => {
    expect(resolveCorsOrigin()).toBe(true)
  })
})
