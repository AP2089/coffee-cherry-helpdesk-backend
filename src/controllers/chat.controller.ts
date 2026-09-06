import type { NextFunction, Request, Response } from 'express'
import * as chatService from '../services/chat.service'
import { AppError } from '../middleware/errorHandler'

function parseLimit(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseOffset(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function listConversations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const conversations = await chatService.listConversations({
      limit: parseLimit(req.query.limit),
      offset: parseOffset(req.query.offset),
    })
    res.json({ success: true, data: conversations })
  } catch (error) {
    next(error)
  }
}

export async function getConversationMessages(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionId = req.params.sessionId?.trim()

    if (!sessionId) {
      throw new AppError('sessionId is required', 400)
    }

    const meta = await chatService.getConversationMeta(sessionId)

    if (!meta) {
      throw new AppError('Conversation not found', 404)
    }

    const before = typeof req.query.before === 'string' ? req.query.before : undefined
    const { messages, hasMore } = await chatService.getMessagesPage(sessionId, {
      limit: parseLimit(req.query.limit),
      before,
    })

    res.json({
      success: true,
      data: {
        meta,
        messages,
        hasMore,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteConversation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionId = req.params.sessionId?.trim()

    if (!sessionId) {
      throw new AppError('sessionId is required', 400)
    }

    const deleted = await chatService.deleteConversation(sessionId)

    if (!deleted) {
      throw new AppError('Conversation not found', 404)
    }

    res.json({ success: true, data: { sessionId } })
  } catch (error) {
    next(error)
  }
}
