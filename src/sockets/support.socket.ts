import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { env } from '../config/env'
import { resolveCorsOrigin } from '../config/cors'
import * as chatService from '../services/chat.service'
import { UserRole } from '../types'
import { verifyAuthToken } from '../utils/jwt'

function resolveSocketCorsOrigin(): string | string[] | boolean {
  const origin = resolveCorsOrigin()

  if (typeof origin === 'function') {
    return true
  }

  return origin
}

function resolveAgentAuth(token?: string): { username: string; role: UserRole } | null {
  if (!token) return null

  if (env.supportAgentToken && token === env.supportAgentToken) {
    return { username: 'agent', role: UserRole.Manager }
  }

  try {
    const payload = verifyAuthToken(token)
    return { username: payload.username, role: payload.role }
  } catch {
    return null
  }
}

export function initSupportSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: resolveSocketCorsOrigin(),
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  })

  io.on('connection', (socket) => {
    socket.on(
      'support:join',
      async (payload: {
        sessionId?: string
        guestName?: string
        guestEmail?: string
        locale?: string
      }) => {
        const sessionId = payload?.sessionId?.trim()

        if (!sessionId) {
          socket.emit('support:error', { message: 'sessionId is required' })
          return
        }

        const locale = payload.locale === 'en' ? 'en' : 'ru'

        try {
          socket.data.sessionId = sessionId
          socket.data.role = 'user'
          await socket.join(sessionId)

          const result = await chatService.ensureConversation(
            sessionId,
            {
              guestName: payload.guestName,
              guestEmail: payload.guestEmail,
            },
            locale,
          )

          const page = await chatService.getMessagesPage(sessionId, { limit: 20 })

          socket.emit('support:history', {
            messages: page.messages,
            hasMore: page.hasMore,
            guestName: result.guestName,
            guestEmail: result.guestEmail,
          })
        } catch (error) {
          console.error('[socket] support:join failed', error)
          const message = error instanceof Error ? error.message : 'Failed to join chat'
          socket.emit('support:error', { message })
        }
      },
    )

    socket.on('support:load-more', async (payload: { before?: string }) => {
      const sessionId = socket.data.sessionId as string | undefined

      if (!sessionId || socket.data.role !== 'user') {
        socket.emit('support:error', { message: 'Not joined to chat' })
        return
      }

      try {
        const page = await chatService.getMessagesPage(sessionId, {
          limit: 20,
          before: typeof payload?.before === 'string' ? payload.before : undefined,
        })

        socket.emit('support:history-page', {
          messages: page.messages,
          hasMore: page.hasMore,
        })
      } catch (error) {
        console.error('[socket] support:load-more failed', error)
        socket.emit('support:error', { message: 'Failed to load messages' })
      }
    })

    socket.on('support:message', async (payload: { text?: string }) => {
      const sessionId = socket.data.sessionId as string | undefined
      const text = payload?.text?.trim()

      if (!sessionId || socket.data.role !== 'user') {
        socket.emit('support:error', { message: 'Not joined to chat' })
        return
      }

      if (!text) {
        socket.emit('support:error', { message: 'Message is empty' })
        return
      }

      try {
        const message = await chatService.createMessage(sessionId, 'user', text)
        const meta = await chatService.getConversationMeta(sessionId)
        io.to(sessionId).emit('support:message', { message })
        io.to('support-agents').emit('support:user-message', { sessionId, message, meta })
      } catch (error) {
        console.error('[socket] support:message failed', error)
        socket.emit('support:error', { message: 'Failed to send message' })
      }
    })

    socket.on('support:agent:join', (payload: { token?: string }) => {
      const agent = resolveAgentAuth(payload?.token)

      if (!agent) {
        socket.emit('support:error', { message: 'Unauthorized agent' })
        return
      }

      socket.data.role = 'agent'
      socket.data.username = agent.username
      socket.data.userRole = agent.role
      void socket.join('support-agents')
      socket.emit('support:agent:joined', agent)
    })

    socket.on('support:agent:select', async (payload: { sessionId?: string }) => {
      if (socket.data.role !== 'agent') {
        socket.emit('support:error', { message: 'Unauthorized agent' })
        return
      }

      const sessionId = payload?.sessionId?.trim()

      if (!sessionId) {
        socket.emit('support:error', { message: 'sessionId is required' })
        return
      }

      try {
        const meta = await chatService.getConversationMeta(sessionId)

        if (!meta) {
          socket.emit('support:error', { message: 'Conversation not found' })
          return
        }

        for (const room of socket.rooms) {
          if (room !== socket.id && room !== 'support-agents') {
            void socket.leave(room)
          }
        }

        await socket.join(sessionId)

        const messages = await chatService.getMessagesPage(sessionId, { limit: 20 })

        socket.emit('support:agent:history', {
          sessionId,
          meta,
          messages: messages.messages,
          hasMore: messages.hasMore,
        })
      } catch (error) {
        console.error('[socket] support:agent:select failed', error)
        socket.emit('support:error', { message: 'Failed to load conversation' })
      }
    })

    socket.on('support:agent:reply', async (payload: { sessionId?: string; text?: string }) => {
      if (socket.data.role !== 'agent') {
        socket.emit('support:error', { message: 'Unauthorized agent' })
        return
      }

      if (socket.data.userRole === UserRole.Guest || socket.data.username === 'guest') {
        socket.emit('support:error', { message: 'У вас нет прав для редактирования' })
        return
      }

      const sessionId = payload?.sessionId?.trim()
      const text = payload?.text?.trim()

      if (!sessionId || !text) {
        socket.emit('support:error', { message: 'Invalid reply payload' })
        return
      }

      try {
        const message = await chatService.createMessage(sessionId, 'agent', text)
        io.to(sessionId).emit('support:message', { message })
        io.to('support-agents').emit('support:message', { message })
      } catch (error) {
        console.error('[socket] support:agent:reply failed', error)
        socket.emit('support:error', { message: 'Failed to send reply' })
      }
    })
  })

  console.log('[socket] support chat initialized')

  return io
}
