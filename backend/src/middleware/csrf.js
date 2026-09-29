import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'
import { HttpError } from '../utils/HttpError.js'
import { cookieNames } from '../utils/cookieNames.js'

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function signatureFor(nonce) {
  return createHmac('sha256', env.refreshSecret).update(`credenza-csrf:${nonce}`).digest('hex')
}

export function createCsrfToken() {
  const nonce = randomBytes(32).toString('hex')
  return `${nonce}.${signatureFor(nonce)}`
}

export function verifyCsrfToken(token) {
  if (typeof token !== 'string') return false
  const [nonce, signature, extra] = token.split('.')
  if (extra !== undefined || !/^[a-f0-9]{64}$/.test(nonce || '') || !/^[a-f0-9]{64}$/.test(signature || '')) return false
  const expected = Buffer.from(signatureFor(nonce), 'hex')
  const provided = Buffer.from(signature, 'hex')
  return timingSafeEqual(expected, provided)
}

export function csrfEndpoint(_request, response) {
  const csrfToken = createCsrfToken()
  response.cookie(cookieNames.csrf, csrfToken, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/api',
  })
  response.json({ csrfToken })
}

export function csrfProtection(request, _response, next) {
  if (!unsafeMethods.has(request.method)) return next()

  const origin = request.get('origin')
  if (origin && !env.clientOrigins.includes(origin)) return next(new HttpError(403, 'This request could not be verified.'))
  const cookieToken = request.cookies?.[cookieNames.csrf]
  const headerToken = request.get('x-csrf-token')
  if (!cookieToken || !headerToken || cookieToken !== headerToken || !verifyCsrfToken(cookieToken)) {
    return next(new HttpError(403, 'This request could not be verified.'))
  }
  return next()
}