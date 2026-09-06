import { Router } from 'express'
import * as controller from '../controllers'
import * as authController from '../controllers/auth.controller'
import * as chatController from '../controllers/chat.controller'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/health', controller.health)

router.post('/auth/login', authController.login)
router.get('/auth/me', requireAuth, authController.me)

router.get('/conversations', requireAuth, chatController.listConversations)
router.get(
  '/conversations/:sessionId/messages',
  requireAuth,
  chatController.getConversationMessages,
)
router.delete(
  '/conversations/:sessionId',
  requireAuth,
  requireAdmin,
  chatController.deleteConversation,
)

export default router
