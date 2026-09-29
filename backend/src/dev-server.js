import { env } from './config/env.js'
import { knex } from './db/knex.js'
import { app } from './app.js'

await knex.raw('select 1')
const server = app.listen(env.port, () => {
  console.info(`Credenza API listening on port ${env.port} (${env.nodeEnv})`)
})

async function shutdown(signal) {
  console.info(`${signal} received; closing server.`)
  server.close(async () => {
    await knex.destroy()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))