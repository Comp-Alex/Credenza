import { knex } from '../db/knex.js'
import { HttpError } from '../utils/HttpError.js'
import { cookieNames, readAccessToken, rotateRefreshToken } from '../utils/tokens.js'

export async function authenticate(request, response, next) {
  const accessToken = request.cookies?.[cookieNames.access]
  let claims
  if (accessToken) {
    try {
      claims = readAccessToken(accessToken)
    } catch {
      // A refresh cookie may still be valid after the access token expires.
    }
  }
  if (claims) {
    const user = await knex('users').select('id', 'email', 'display_name', 'role').where({ id: claims.sub }).first()
    if (user) {
      request.user = user
      return next()
    }
  }

  const refreshToken = request.cookies?.[cookieNames.refresh]
  if (refreshToken) {
    try {
      const user = await rotateRefreshToken(refreshToken, response)
      if (user) {
        request.user = user
        return next()
      }
    } catch {
      return next(new HttpError(503, 'Authentication is temporarily unavailable.'))
    }
  }
  return next(new HttpError(401, 'Sign in to continue.'))
}

export function requireRole(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) return next(new HttpError(403, 'You do not have permission to do that.'))
    return next()
  }
}