import { createServer } from 'http'
import { connectDatabase } from './config/database'
import { env } from './config/env'
import { createApp } from './app'
import { initSupportSocket } from './sockets/support.socket'

async function bootstrap(): Promise<void> {
  await connectDatabase()

  const app = createApp()
  const httpServer = createServer(app)

  initSupportSocket(httpServer)

  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(`[helpdesk-backend] listening on 0.0.0.0:${env.port}`)
  })
}

bootstrap().catch((error) => {
  console.error('[helpdesk-backend] failed to start', error)
  process.exit(1)
})
