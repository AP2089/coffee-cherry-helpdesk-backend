import { Schema, model, type Document, type Model } from 'mongoose'
import type { IConversation } from '../types'

export interface ConversationDocument extends IConversation, Document {}

const conversationSchema = new Schema<ConversationDocument>(
  {
    sessionId: { type: String, required: true, unique: true, trim: true },
    guestName: { type: String, trim: true, default: '' },
    guestEmail: { type: String, trim: true, lowercase: true, default: '' },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export const Conversation: Model<ConversationDocument> = model<ConversationDocument>(
  'Conversation',
  conversationSchema,
)
