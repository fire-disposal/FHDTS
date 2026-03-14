import { createServer } from './app/bootstrap.js'
import { gracefulShutdown } from './shared/platform/database.js'
import { env } from './shared/platform/env.js'

try {
  const server = await createServer()
  await server.listen({ port: env.PORT, host: '0.0.0.0' })
  server.log.info(`Server running at http://0.0.0.0:${env.PORT}`)
} catch (error) {
  console.error(error)
  await gracefulShutdown()
  process.exit(1)
}
