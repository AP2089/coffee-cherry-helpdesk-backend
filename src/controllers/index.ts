import type { Request, Response } from 'express'
import { isDatabaseConnected } from '../config/database'

export async function health(_req: Request, res: Response): Promise<void> {
  const dbOk = isDatabaseConnected()

  if (!dbOk) {
    res.status(503).json({
      status: 'error',
      mongodb: 'disconnected',
    })
    return
  }

  res.status(200).json({
    status: 'ok',
  })
}
