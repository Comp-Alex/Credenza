import { Router } from 'express'
import { query } from 'express-validator'
import { knex } from '../db/knex.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = Router()

router.get('/admin/audit-logs', authenticate, requireRole('admin'), [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
], validateRequest, async (request, response) => {
  const limit = Number(request.query.limit || 50)
  const offset = Number(request.query.offset || 0)
  const logs = await knex('audit_logs').select('id', 'user_id', 'action', 'metadata', 'timestamp').orderBy('timestamp', 'desc').limit(limit).offset(offset)
  response.json({ logs, limit, offset })
})

export default router