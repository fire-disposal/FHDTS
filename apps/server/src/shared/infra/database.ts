import { createClient, createClient } from '@libsql/client'
import { LibSQLAdapter, PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

// Create libsql client
const libsql = createClient({
  url: `file://${process.cwd()}/${env.DATABASE_URL.replace('file:', '').replace('./', '')}`,
})

// Initialize Prisma with the libsql adapter
const adapter = new PrismaLibSql(libsql)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function gracefulShutdown() {
  console.log('Shutting down database connections...')
  await prisma.$disconnect()
  console.log('Database connections closed')
}

export type { PrismaClient } from '@prisma/client'
export { Prisma } from '@prisma/client'
