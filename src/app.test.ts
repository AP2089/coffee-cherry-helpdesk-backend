import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('Helpdesk HTTP app', () => {
  const app = createApp()

  it('GET / returns api info', async () => {
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ name: 'coffee cherry helpdesk api', version: '1.0.0' })
  })

  it('GET /api/conversations requires auth', async () => {
    const response = await request(app).get('/api/conversations')

    expect(response.status).toBe(401)
  })

  it('DELETE /api/conversations/:id requires auth', async () => {
    const response = await request(app).delete('/api/conversations/session-1')

    expect(response.status).toBe(401)
  })
})
