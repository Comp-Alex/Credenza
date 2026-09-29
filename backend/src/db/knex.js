import knexFactory from 'knex'
import { env } from '../config/env.js'

export const knex = knexFactory({
  client: 'pg',
  connection: env.databaseUrl,
  pool: { min: 0, max: env.nodeEnv === 'test' ? 2 : env.databasePoolMax },
})