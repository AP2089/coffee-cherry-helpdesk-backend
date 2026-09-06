import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './config/env'
import { resolveCorsOrigin } from './config/cors'
import routes from './routes'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

export function createApp(): express.Application {
  const app = express()

  app.use(cors({ origin: resolveCorsOrigin() }))
  app.use(express.json())
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

  app.get('/', (_req, res) => {
    res.json({ name: 'coffee cherry helpdesk api', version: '1.0.0' })
  })

  app.use('/api', routes)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
