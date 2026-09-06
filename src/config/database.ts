import mongoose from 'mongoose'
import { env } from './env'

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true)

  await mongoose.connect(env.mongoUri)

  console.log('[mongodb] connected')
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1
}
