import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'
import { appRouter } from './router/index.js'
import {
  getDatabaseInfo,
  getDatabaseProvider,
  gracefulShutdown,
  prisma,
} from './shared/infra/database.js'
import { env } from './shared/infra/env.js'
import { createTRPCContext } from './trpc/context.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({ logger: true })

await fastify.register(fastifyCors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
})

await fastify.register(fastifyStatic, {
  root: join(__dirname, '../../public'),
  prefix: '/',
})

await fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: ({ req }: { req: { headers: Record<string, string | string[] | undefined> } }) =>
      createTRPCContext({ req }),
  },
})

fastify.get('/api/health', async () => {
  const healthInfo: {
    status: string
    timestamp: string
    uptime: number
    environment: string
    database: {
      provider: 'sqlite' | 'postgresql'
      status: string
      [key: string]: unknown
    }
    services: {
      api: string
      database: string
    }
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: {
      provider: getDatabaseProvider(),
      status: 'unknown',
    },
    services: {
      api: 'ok',
      database: 'unknown',
    },
  }

  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`
    healthInfo.database.status = 'connected'
    healthInfo.services.database = 'ok'

    // 获取数据库信息
    const dbInfo = getDatabaseInfo()
    healthInfo.database = {
      ...healthInfo.database,
      ...dbInfo,
    }
  } catch (error) {
    healthInfo.database.status = 'disconnected'
    healthInfo.services.database = 'error'
    healthInfo.database.error = (error as Error).message
    healthInfo.status = 'degraded'
  }

  return healthInfo
})

fastify.get('/api/info', async () => ({
  name: 'Digital Twin API',
  version: '0.0.1',
  environment: env.NODE_ENV,
  database: getDatabaseInfo(),
  features: {
    authentication: true,
    realtime: false,
    iot: false,
    digitalTwin: true,
  },
  deployment: {
    mode: env.NODE_ENV === 'production' ? 'docker-compose' : 'development',
    database: env.NODE_ENV === 'production' ? 'postgresql-fixed' : 'sqlite-auto',
  },
}))

const shutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully`)

  try {
    await fastify.close()
    await gracefulShutdown()
    process.exit(0)
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

try {
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
  fastify.log.info(`Server running at http://0.0.0.0:${env.PORT}`)
} catch (error) {
  fastify.log.error(error)
  await gracefulShutdown()
  process.exit(1)
}
