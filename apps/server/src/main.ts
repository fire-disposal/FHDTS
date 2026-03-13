import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { startTcpServer } from './iot/server.js'
import { gracefulShutdown } from './shared/infra/database.js'
import { prisma } from './shared/infra/prisma.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({
  logger: true,
})

await fastify.register(fastifyCors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
})

await fastify.register(fastifyStatic, {
  root: join(__dirname, '../../public'),
  prefix: '/',
})

fastify.register(async app => {
  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }))

  app.get('/trpc', async () => ({ message: 'tRPC endpoint ready' }))
})

const PORT = process.env.PORT || 3000

const start = async () => {
  let tcpServer: ReturnType<typeof startTcpServer> | null = null

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)

    try {
      await fastify.close()
      console.log('✅ HTTP server closed')

      if (tcpServer) {
        tcpServer.close()
        console.log('✅ TCP server closed')
      }

      await gracefulShutdown()
      console.log('✅ Database connections closed')

      process.exit(0)
    } catch (err) {
      console.error('❌ Error during shutdown:', err)
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  try {
    await fastify.listen({ port: Number(PORT), host: '0.0.0.0' })
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`)

    tcpServer = startTcpServer(5858)
    console.log('📡 TCP IoT server listening on port 5858')
  } catch (err) {
    fastify.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

start()
