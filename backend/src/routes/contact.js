import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { body } from 'express-validator'
import { env } from '../config/env.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { knex } from '../db/knex.js'
import { recordAudit } from '../utils/audit.js'
import { HttpError } from '../utils/HttpError.js'

const router = Router()
const contactLimiter = rateLimit({
  windowMs: env.contactRateLimitWindowMs,
  limit: env.contactRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages were sent from this connection. Please try again later.' },
})

router.post('/contact', contactLimiter, [
  body('name').optional().isString().trim().isLength({ max: 80 }).withMessage('Names must be under 80 characters.'),
  body('email').isEmail().withMessage('Enter a valid email address.').bail().normalizeEmail(),
  body('message').isString().trim().isLength({ min: 10, max: 3000 }).withMessage('Messages must be 10 to 3,000 characters long.'),
  body('recipientUserId').optional().isUUID().withMessage('The recipient is not valid.'),
], validateRequest, async (request, response) => {
  const recipientUserId = request.body.recipientUserId || null
  if (recipientUserId && !await knex('users').where({ id: recipientUserId }).first('id')) throw new HttpError(404, 'That portfolio is not available.')
  const [created] = await knex('contact_messages').insert({ recipient_user_id: recipientUserId, sender_name: request.body.name || '', sender_email: request.body.email, message: request.body.message }).returning(['id', 'created_at'])
  await recordAudit(knex, recipientUserId, 'contact.message_received', { messageId: created.id })
  response.status(202).json({ accepted: true, id: created.id, createdAt: created.created_at })
})

export default router