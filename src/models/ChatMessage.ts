import { Schema, model, type Document, type Model } from 'mongoose'
import type { ChatSender, IChatMessage } from '../types'

export interface ChatMessageDocument extends IChatMessage, Document {}

const chatMessageSchema = new Schema<ChatMessageDocument>(
  {
    sessionId: { type: String, required: true, trim: true, index: true },
    sender: {
      type: String,
      enum: ['user', 'agent'] satisfies ChatSender[],
      required: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
)

export const ChatMessage: Model<ChatMessageDocument> = model<ChatMessageDocument>(
  'ChatMessage',
  chatMessageSchema,
)
