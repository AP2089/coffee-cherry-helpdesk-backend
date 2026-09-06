import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ChatMessage } from '../models/ChatMessage'
import { Conversation } from '../models/Conversation'
import { deleteConversation, getMessagesPage } from '../services/chat.service'

vi.mock('../models/ChatMessage', () => ({
  ChatMessage: {
    findById: vi.fn(),
    find: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock('../models/Conversation', () => ({
  Conversation: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}))

function mockFindChain(result: unknown[]) {
  return {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(result),
  }
}

describe('chat.service pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMessagesPage returns empty result for invalid before cursor', async () => {
    vi.mocked(ChatMessage.findById).mockReturnValue({
      lean: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      }),
    } as never)

    const page = await getMessagesPage('session-1', { before: 'missing-id' })

    expect(page).toEqual({ hasMore: false, messages: [] })
  })

  it('getMessagesPage maps messages and hasMore flag', async () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z')

    vi.mocked(ChatMessage.find).mockReturnValue(
      mockFindChain([
        {
          _id: 'msg-2',
          sessionId: 'session-1',
          sender: 'user',
          text: 'Second',
          createdAt,
        },
        {
          _id: 'msg-1',
          sessionId: 'session-1',
          sender: 'agent',
          text: 'First',
          createdAt: new Date('2026-01-01T09:00:00.000Z'),
        },
      ]) as never,
    )

    const page = await getMessagesPage('session-1', { limit: 20 })

    expect(page.hasMore).toBe(false)
    expect(page.messages).toHaveLength(2)
    expect(page.messages[0]?.text).toBe('First')
    expect(page.messages[1]?.text).toBe('Second')
  })

  it('deleteConversation removes conversation and messages', async () => {
    vi.mocked(Conversation.findOne).mockReturnValue({
      exec: vi.fn().mockResolvedValue({ sessionId: 'session-1' }),
    } as never)

    vi.mocked(ChatMessage.deleteMany).mockReturnValue({
      exec: vi.fn().mockResolvedValue({ deletedCount: 3 }),
    } as never)

    vi.mocked(Conversation.deleteOne).mockReturnValue({
      exec: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    } as never)

    const deleted = await deleteConversation('session-1')

    expect(deleted).toBe(true)
    expect(ChatMessage.deleteMany).toHaveBeenCalledWith({ sessionId: 'session-1' })
    expect(Conversation.deleteOne).toHaveBeenCalledWith({ sessionId: 'session-1' })
  })

  it('deleteConversation returns false when conversation is missing', async () => {
    vi.mocked(Conversation.findOne).mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as never)

    const deleted = await deleteConversation('missing')

    expect(deleted).toBe(false)
  })
})
