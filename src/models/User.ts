import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { Schema, model, type Document, type Model } from 'mongoose'
import { UserRole, type IUser } from '../types'

export interface UserDocument extends IUser, Document {}

const userSchema = new Schema<UserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: Object.values(UserRole) },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false

  const hashBuffer = Buffer.from(hash, 'hex')
  const derived = scryptSync(password, salt, 64)

  if (hashBuffer.length !== derived.length) return false

  return timingSafeEqual(hashBuffer, derived)
}

export const User: Model<UserDocument> = model<UserDocument>('User', userSchema)
