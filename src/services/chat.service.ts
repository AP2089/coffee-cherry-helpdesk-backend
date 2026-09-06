import { Conversation } from '../models/Conversation'
import { ChatMessage } from '../models/ChatMessage'
import type {
  ChatGuestProfile,
  ChatMessageDTO,
  ChatSender,
  ConversationListItem,
  MessagesPageResult,
  PaginatedList,
} from '../types'

const PAGE_SIZE_DEFAULT = 20
const PAGE_SIZE_MAX = 100

function clampPageSize(limit?: number): number {
  const value = limit ?? PAGE_SIZE_DEFAULT
  return Math.min(Math.max(value, 1), PAGE_SIZE_MAX)
}

async function mapConversationItem(conversation: {
  sessionId: string
  guestName?: string
  guestEmail?: string
  status: 'open' | 'closed'
  updatedAt?: Date
}): Promise<ConversationListItem> {
  const lastMessage = await ChatMessage.findOne({ sessionId: conversation.sessionId })
    .sort({ createdAt: -1 })
    .lean()
    .exec()

  return {
    sessionId: conversation.sessionId,
    guestName: conversation.guestName ?? '',
    guestEmail: conversation.guestEmail ?? '',
    status: conversation.status,
    updatedAt: conversation.updatedAt?.toISOString() ?? new Date().toISOString(),
    lastMessage: lastMessage
      ? {
          text: lastMessage.text,
          sender: lastMessage.sender,
          createdAt: lastMessage.createdAt?.toISOString() ?? new Date().toISOString(),
        }
      : undefined,
  }
}

const WELCOME_MESSAGES = {
  ru: 'Здравствуйте! Напишите ваш вопрос — мы ответим в ближайшее время.',
  en: 'Hello! Send your question — we will reply shortly.',
} as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toMessageDTO(doc: {
  _id: { toString(): string }
  sessionId: string
  sender: ChatSender
  text: string
  createdAt?: Date
}): ChatMessageDTO {
  return {
    id: doc._id.toString(),
    sessionId: doc.sessionId,
    sender: doc.sender,
    text: doc.text,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

function normalizeProfile(profile?: Partial<ChatGuestProfile>): ChatGuestProfile {
  return {
    guestName: profile?.guestName?.trim() ?? '',
    guestEmail: profile?.guestEmail?.trim().toLowerCase() ?? '',
  }
}

export function validateGuestProfile(profile: Partial<ChatGuestProfile>): ChatGuestProfile {
  const normalized = normalizeProfile(profile)

  if (!normalized.guestName) {
    throw new Error('Guest name is required')
  }

  if (!normalized.guestEmail || !EMAIL_PATTERN.test(normalized.guestEmail)) {
    throw new Error('Valid guest email is required')
  }

  return normalized
}

async function loadMessages(sessionId: string): Promise<ChatMessageDTO[]> {
  const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).lean().exec()

  return messages.map((message) =>
    toMessageDTO({
      _id: { toString: () => String(message._id) },
      sessionId: message.sessionId,
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
    }),
  )
}

export async function ensureConversation(
  sessionId: string,
  profile?: Partial<ChatGuestProfile>,
  locale: 'ru' | 'en' = 'ru',
): Promise<{ messages: ChatMessageDTO[]; isNew: boolean; guestName: string; guestEmail: string }> {
  let conversation = await Conversation.findOne({ sessionId }).exec()
  const isNew = !conversation

  if (!conversation) {
    const guest = validateGuestProfile(profile ?? {})

    conversation = await Conversation.create({
      sessionId,
      guestName: guest.guestName,
      guestEmail: guest.guestEmail,
      status: 'open',
    })

    const welcome = await ChatMessage.create({
      sessionId,
      sender: 'agent',
      text: WELCOME_MESSAGES[locale],
    })

    return {
      isNew: true,
      guestName: guest.guestName,
      guestEmail: guest.guestEmail,
      messages: [toMessageDTO(welcome)],
    }
  }

  const guest = normalizeProfile({
    guestName: profile?.guestName || conversation.guestName,
    guestEmail: profile?.guestEmail || conversation.guestEmail,
  })

  if (guest.guestName && guest.guestName !== conversation.guestName) {
    conversation.guestName = guest.guestName
  }

  if (guest.guestEmail && guest.guestEmail !== conversation.guestEmail) {
    conversation.guestEmail = guest.guestEmail
  }

  if (conversation.isModified()) {
    await conversation.save()
  }

  return {
    isNew,
    guestName: conversation.guestName ?? '',
    guestEmail: conversation.guestEmail ?? '',
    messages: await loadMessages(sessionId),
  }
}

export async function getMessages(sessionId: string): Promise<ChatMessageDTO[]> {
  return loadMessages(sessionId)
}

export async function getMessagesPage(
  sessionId: string,
  options: { limit?: number; before?: string } = {},
): Promise<MessagesPageResult> {
  const limit = clampPageSize(options.limit)
  const filter: Record<string, unknown> = { sessionId }

  if (options.before) {
    const anchor = await ChatMessage.findById(options.before).lean().exec()
    if (!anchor?.createdAt) {
      return { hasMore: false, messages: [] }
    }
    filter.createdAt = { $lt: anchor.createdAt }
  }

  const batch = await ChatMessage.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean()
    .exec()

  const hasMore = batch.length > limit
  const slice = hasMore ? batch.slice(0, limit) : batch

  return {
    hasMore,
    messages: slice.reverse().map((message) =>
      toMessageDTO({
        _id: { toString: () => String(message._id) },
        sessionId: message.sessionId,
        sender: message.sender,
        text: message.text,
        createdAt: message.createdAt,
      }),
    ),
  }
}

export async function getConversationMeta(sessionId: string) {
  const conversation = await Conversation.findOne({ sessionId }).lean().exec()

  if (!conversation) return null

  return {
    sessionId: conversation.sessionId,
    guestName: conversation.guestName ?? '',
    guestEmail: conversation.guestEmail ?? '',
    status: conversation.status,
  }
}

export async function listConversations(
  options: { limit?: number; offset?: number } = {},
): Promise<PaginatedList<ConversationListItem>> {
  const limit = clampPageSize(options.limit)
  const offset = Math.max(options.offset ?? 0, 0)

  const [total, conversations] = await Promise.all([
    Conversation.countDocuments().exec(),
    Conversation.find().sort({ updatedAt: -1 }).skip(offset).limit(limit).lean().exec(),
  ])

  const items = await Promise.all(
    conversations.map((conversation) => mapConversationItem(conversation)),
  )

  return {
    items,
    total,
    hasMore: offset + items.length < total,
  }
}

export async function deleteConversation(sessionId: string): Promise<boolean> {
  const conversation = await Conversation.findOne({ sessionId }).exec()

  if (!conversation) return false

  await ChatMessage.deleteMany({ sessionId }).exec()
  await Conversation.deleteOne({ sessionId }).exec()

  return true
}

export async function createMessage(
  sessionId: string,
  sender: ChatSender,
  text: string,
): Promise<ChatMessageDTO> {
  const trimmed = text.trim()

  if (!trimmed) {
    throw new Error('Message text is required')
  }

  const message = await ChatMessage.create({
    sessionId,
    sender,
    text: trimmed,
  })

  await Conversation.updateOne(
    { sessionId },
    { $set: { status: 'open', updatedAt: new Date() } },
  ).exec()

  return toMessageDTO(message)
}
