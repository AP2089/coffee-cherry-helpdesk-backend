import { env } from './env'

const LOCAL_FRONTEND_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:3000|:3002)?$/

export function resolveCorsOrigin():
  | boolean
  | string
  | string[]
  | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) {
  if (env.corsOrigin === '*') return true

  const origins = env.corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (env.corsRelaxedLocal) {
    return (origin, callback) => {
      if (!origin || origins.includes(origin) || LOCAL_FRONTEND_ORIGIN.test(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Not allowed by CORS'))
    }
  }

  if (origins.length === 1) return origins[0]

  return origins
}
