import { Prisma, PrismaClient } from '@prisma/client'
import { env } from './env.js'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 根据环境获取数据库连接URL
function getDatabaseUrl(): string {
  // 生产环境使用固定的PostgreSQL连接
  if (env.NODE_ENV === 'production') {
    return 'postgresql://digitaltwin:digitaltwin_prod_password@postgres:5432/digitaltwin'
  }

  // 开发环境使用SQLite
  if (env.NODE_ENV === 'development') {
    return env.DATABASE_URL || 'file:./dev.db'
  }

  // 测试环境或其他环境
  return env.DATABASE_URL || 'file:./test.db'
}

// 获取数据库提供者类型
export function getDatabaseProvider(): 'sqlite' | 'postgresql' {
  const url = getDatabaseUrl()
  if (url.startsWith('file:')) return 'sqlite'
  if (url.startsWith('postgresql:')) return 'postgresql'
  return 'postgresql' // 默认
}

// 创建Prisma客户端实例
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Prisma 7: 连接URL通过环境变量DATABASE_URL自动配置
    // 日志配置
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// 开发环境全局缓存Prisma实例
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 优雅关闭
export async function gracefulShutdown() {
  await prisma.$disconnect()
}

// 数据库连接测试
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('数据库连接测试失败:', error)
    return false
  }
}

// 获取数据库信息
export function getDatabaseInfo() {
  const provider = getDatabaseProvider()
  const url = getDatabaseUrl()

  if (provider === 'sqlite') {
    return {
      provider: 'sqlite' as const,
      path: url.replace('file:', ''),
      mode: env.NODE_ENV,
    }
  } else {
    // 解析PostgreSQL连接信息
    const urlObj = new URL(url.replace('postgresql://', 'http://'))
    return {
      provider: 'postgresql' as const,
      host: urlObj.hostname,
      port: urlObj.port || '5432',
      database: urlObj.pathname.replace('/', ''),
      mode: env.NODE_ENV,
    }
  }
}

// 导出类型
export { Prisma }
export type { PrismaClient }

// 导出数据库连接URL函数（用于测试和工具）
export { getDatabaseUrl }
