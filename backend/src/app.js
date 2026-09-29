import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { knex } from './db/knex.js'
import { csrfEndpoint, csrfProtection } from './middleware/csrf.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import contactRoutes from './routes/contact.js'
import portfolioRoutes from './routes/portfolio.js'
import { HttpError } from './utils/HttpError.js'

export const app = express()
app.disable('x-powered-by')
app.set('trust proxy', env.nodeEnv === 'production' ? 1 : false)
app.use((request, response, next) => {
  if (env.nodeEnv === 'production' && !request.secure) return response.status(400).json({ error: 'HTTPS is required.' })
  return next()
})

app.use(helmet())
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) return callback(null, true)
    return callback(new HttpError(403, 'This origin is not allowed.'))
  },
}))
app.use(express.json({ limit: '64kb', strict: true }))
app.use(cookieParser())

app.get('/health', async (_request, response) => {
  await knex.raw('select 1')
  response.json({ status: 'ok' })
})
app.get('/api/security/csrf', csrfEndpoint)

app.use('/api', csrfProtection)
app.use('/api', authRoutes)
app.use('/api', portfolioRoutes)
app.use('/api', contactRoutes)
app.use('/api', adminRoutes)
app.use(notFound)
app.use(errorHandler)

export default app