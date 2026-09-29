import 'dotenv/config'

function requiredSecret(name) {
  const value = process.env[name]
  if (!value || value.length < 32) {
    throw new Error(`${name} must be configured with at least 32 characters.`)
  }
  return value
}

const nodeEnv = process.env.NODE_ENV || 'development'
const port = Number.parseInt(process.env.PORT || '4000', 10)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must point to a PostgreSQL database.')

export const env = Object.freeze({
  nodeEnv,
  port,
  databaseUrl: process.env.DATABASE_URL,
  databasePoolMax: Number.parseInt(process.env.DATABASE_POOL_MAX || (nodeEnv === 'production' ? '3' : '10'), 10),
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean),
  accessSecret: requiredSecret('JWT_ACCESS_SECRET'),
  refreshSecret: requiredSecret('JWT_REFRESH_SECRET'),
  contactRateLimitWindowMs: Number.parseInt(process.env.CONTACT_RATE_LIMIT_WINDOW_MS || '3600000', 10),
  contactRateLimitMax: Number.parseInt(process.env.CONTACT_RATE_LIMIT_MAX || '5', 10),
  cookieSecure: nodeEnv === 'production',
  cookieSameSite: 'lax',
})

if (env.nodeEnv === 'production' && env.clientOrigins.length === 0) {
  throw new Error('CLIENT_ORIGINS must include the production frontend origin.')
}
if (env.refreshSecret === env.accessSecret) throw new Error('JWT access and refresh secrets must be different.')