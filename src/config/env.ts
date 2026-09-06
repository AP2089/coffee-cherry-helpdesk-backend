import dotenv from 'dotenv'

dotenv.config()

export const env = {
  port: Number(process.env.PORT) || 3013,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/coffee_cherry',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  corsRelaxedLocal: process.env.CORS_RELAXED_LOCAL === 'true',
  supportAgentToken: process.env.SUPPORT_AGENT_TOKEN || '',
  jwtSecret: process.env.JWT_SECRET || 'coffee-cherry-dev-secret',
} as const
