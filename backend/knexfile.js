import 'dotenv/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDirectory = dirname(fileURLToPath(import.meta.url))

export default {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 10 },
  migrations: {
    directory: resolve(currentDirectory, '../db/migrations'),
    extension: 'js',
  },
  seeds: {
    directory: resolve(currentDirectory, '../db/seeds'),
    extension: 'js',
  },
}