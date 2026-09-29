import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { body } from 'express-validator'
import { env } from '../config/env.js'
import { authenticate } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { currentSession, loginAccount, logoutAccount, registerAccount } from '../services/authService.js'
import { cookieNames } from '../utils/cookieNames.js'
import { clearAuthCookies, issueTokenPair } from '../utils/tokens.js'

const router = Router()
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many sign-in attempts. Wait a moment and try again.' },
})

const emailField = () => body('email').trim().isEmail().withMessage('Enter a valid email address.')
const passwordField = () => body('password').isString().withMessage('Enter a password.').bail().isLength({ min: 12, max: 128 }).withMessage('Passwords must be 12 to 128 characters long.').bail().custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Passwords must be at most 72 UTF-8 bytes for bcrypt.')

router.get('/auth/session', authenticate, async (request, response) => {
  response.json(await currentSession(request.user))
})

router.post('/register', authLimiter, [
  body('displayName').isString().withMessage('Add a display name.').bail().trim().isLength({ min: 1, max: 80 }).withMessage('Display names must be 1 to 80 characters long.'),
  emailField(),
  passwordField(),
], validateRequest, async (request, response) => {
  const result = await registerAccount(request.body)
  await issueTokenPair(result.user, response)
  response.status(201).json(result)
})

router.post('/login', authLimiter, [emailField(), passwordField()], validateRequest, async (request, response) => {
  response.json(await loginAccount(request.body, response))
})

router.post('/logout', async (request, response) => {
  await logoutAccount(request.cookies?.[cookieNames.refresh])
  clearAuthCookies(response)
  response.clearCookie(cookieNames.csrf, { httpOnly: true, secure: env.cookieSecure, sameSite: env.cookieSameSite, path: '/api' })
  response.status(204).end()
})

export default router