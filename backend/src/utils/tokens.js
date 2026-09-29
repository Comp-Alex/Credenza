import { createHash, randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { knex } from '../db/knex.js'
import { cookieNames } from './cookieNames.js'
const tokenIssuer = 'credenza-api'
const tokenAudience = 'credenza-web'
const accessLifetimeSeconds = 15 * 60
const refreshLifetimeSeconds = 30 * 24 * 60 * 60

export { cookieNames }

function cookieOptions(httpOnly = true) {
  return {
    httpOnly,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/api',
  }
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function signAccessToken(user) {
  return jwt.sign({ role: user.role, type: 'access' }, env.accessSecret, {
    subject: user.id,
    issuer: tokenIssuer,
    audience: tokenAudience,
    expiresIn: accessLifetimeSeconds,
  })
}

function signRefreshToken(user, familyId) {
  return jwt.sign({ type: 'refresh' }, env.refreshSecret, {
    subject: user.id,
    jwtid: randomUUID(),
    familyId,
    issuer: tokenIssuer,
    audience: tokenAudience,
    expiresIn: refreshLifetimeSeconds,
  })
}

async function createTokenPair(database, user, familyId = randomUUID()) {
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user, familyId)
  const expiresAt = new Date(Date.now() + refreshLifetimeSeconds * 1000)
  await database('refresh_tokens').insert({ family_id: familyId, user_id: user.id, token_hash: hashToken(refreshToken), expires_at: expiresAt })
  return { accessToken, refreshToken, expiresAt }
}

export async function issueTokenPair(user, response, database = knex) {
  const pair = await createTokenPair(database, user)
  response.cookie(cookieNames.access, pair.accessToken, { ...cookieOptions(), maxAge: accessLifetimeSeconds * 1000 })
  response.cookie(cookieNames.refresh, pair.refreshToken, { ...cookieOptions(), maxAge: refreshLifetimeSeconds * 1000 })
  return pair
}

export async function rotateRefreshToken(token, response, database = knex) {
  let claims
  try {
    claims = jwt.verify(token, env.refreshSecret, { issuer: tokenIssuer, audience: tokenAudience })
  } catch {
    return null
  }
  if (claims.type !== 'refresh' || !claims.sub || !claims.familyId) return null

  const user = await database.transaction(async (transaction) => {
    const storedToken = await transaction('refresh_tokens').where({ token_hash: hashToken(token) }).forUpdate().first()
    if (!storedToken || storedToken.user_id !== claims.sub || storedToken.family_id !== claims.familyId) return null
    if (storedToken.revoked_at || new Date(storedToken.expires_at) <= new Date()) {
      await transaction('refresh_tokens').where({ family_id: storedToken.family_id }).whereNull('revoked_at').update({ revoked_at: transaction.fn.now() })
      return null
    }

    const account = await transaction('users').where({ id: storedToken.user_id }).first()
    if (!account) return null
    await transaction('refresh_tokens').where({ id: storedToken.id }).update({ revoked_at: transaction.fn.now() })
    const pair = await createTokenPair(transaction, account, storedToken.family_id)
    return { account, pair }
  })

  if (!user) return null
  response.cookie(cookieNames.access, user.pair.accessToken, { ...cookieOptions(), maxAge: accessLifetimeSeconds * 1000 })
  response.cookie(cookieNames.refresh, user.pair.refreshToken, { ...cookieOptions(), maxAge: refreshLifetimeSeconds * 1000 })
  return user.account
}

export function readAccessToken(token) {
  const claims = jwt.verify(token, env.accessSecret, { issuer: tokenIssuer, audience: tokenAudience })
  return claims.type === 'access' && claims.sub ? claims : null
}

export function clearAuthCookies(response) {
  const options = cookieOptions()
  response.clearCookie(cookieNames.access, options)
  response.clearCookie(cookieNames.refresh, options)
}

export function tokenFingerprint(token) {
  return hashToken(token)
}