import dotenv from 'dotenv'
import { z } from 'zod'
import { getDatabaseInfo } from './database.js'

// 加载环境变量
dotenv.config()

// 环境变量模式定义
const envSchema = z.object({
  // 运行环境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // 服务器配置
  PORT: z.coerce.number().default(3000),

  // 数据库配置 - 生产环境使用固定PostgreSQL，开发环境使用SQLite
  DATABASE_URL: z.string().min(1),

  // 安全配置
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS配置
  CORS_ORIGIN: z.string().default('*'),
})

// 开发环境默认值
const developmentDefaults = {
  DATABASE_URL: 'file:./dev.db',
  JWT_SECRET: 'development-jwt-secret-minimum-32-characters-long',
  CORS_ORIGIN: 'http://localhost:5173',
} as const

// 生产环境固定PostgreSQL连接（Docker Compose内部）
const productionDefaults = {
  DATABASE_URL: 'postgresql://digitaltwin:digitaltwin_prod_password@postgres:5432/digitaltwin',
} as const

// 合并环境变量，根据环境提供默认值
function getEnvWithDefaults() {
  const env = process.env
  const nodeEnv = env.NODE_ENV || 'development'

  // 生产环境使用固定PostgreSQL连接
  if (nodeEnv === 'production') {
    return {
      ...env,
      DATABASE_URL: productionDefaults.DATABASE_URL,
      // 生产环境必须提供JWT_SECRET
      JWT_SECRET: env.JWT_SECRET,
      CORS_ORIGIN: env.CORS_ORIGIN || '*',
    }
  }

  // 开发环境使用SQLite和开发默认值
  if (nodeEnv === 'development') {
    return {
      ...env,
      DATABASE_URL: env.DATABASE_URL || developmentDefaults.DATABASE_URL,
      JWT_SECRET: env.JWT_SECRET || developmentDefaults.JWT_SECRET,
      CORS_ORIGIN: env.CORS_ORIGIN || developmentDefaults.CORS_ORIGIN,
    }
  }

  // 测试环境
  return env
}

// 验证环境变量
function validateEnv() {
  try {
    const envWithDefaults = getEnvWithDefaults()
    const parsedEnv = envSchema.parse(envWithDefaults)

    // 生产环境额外验证
    if (parsedEnv.NODE_ENV === 'production') {
      if (!envWithDefaults.JWT_SECRET) {
        throw new Error('生产环境必须设置 JWT_SECRET 环境变量')
      }
    }

    return parsedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter(issue => issue.code === 'invalid_type' && issue.received === 'undefined')
        .map(issue => issue.path.join('.'))

      const invalidVars = error.issues
        .filter(issue => issue.code !== 'invalid_type' || issue.received !== 'undefined')
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)

      console.error('❌ 环境变量配置错误:')

      if (missingVars.length > 0) {
        console.error('   缺失的必需变量:')
        missingVars.forEach(variable => {
          console.error(`   - ${variable}`)
        })

        if (process.env.NODE_ENV === 'development') {
          console.error('\n💡 开发环境提示:')
          console.error('   1. 创建 .env 文件并设置变量')
          console.error('   2. 或使用默认开发配置')
          console.error(`   示例 DATABASE_URL: ${developmentDefaults.DATABASE_URL}`)
          console.error(`   示例 JWT_SECRET: ${developmentDefaults.JWT_SECRET.substring(0, 20)}...`)
        } else if (process.env.NODE_ENV === 'production') {
          console.error('\n🚨 生产环境错误:')
          console.error('   生产环境必须设置 JWT_SECRET 环境变量')
          console.error('   数据库连接已自动配置为固定PostgreSQL实例')
        }
      }

      if (invalidVars.length > 0) {
        console.error('   无效的变量值:')
        invalidVars.forEach(variable => {
          console.error(`   - ${variable}`)
        })
      }

      console.error('\n📋 环境变量要求:')
      console.error('   开发环境:')
      console.error('     - DATABASE_URL: SQLite文件路径 (默认: file:./dev.db)')
      console.error('     - JWT_SECRET: JWT签名密钥，至少32字符 (有默认值)')
      console.error('   生产环境:')
      console.error('     - DATABASE_URL: 自动使用固定PostgreSQL连接')
      console.error('     - JWT_SECRET: 必须设置，至少32字符')
      console.error('   通用配置:')
      console.error('     - JWT_EXPIRES_IN: JWT过期时间 (默认: 7d)')
      console.error('     - PORT: 服务器端口 (默认: 3000)')
      console.error('     - CORS_ORIGIN: CORS允许的源 (开发默认: http://localhost:5173)')
      console.error('     - NODE_ENV: 运行环境 (development/production/test)')
    } else if (error instanceof Error) {
      console.error(`❌ 环境变量错误: ${error.message}`)
    }

    // 生产环境必须退出
    if (process.env.NODE_ENV === 'production') {
      console.error('\n🚨 生产环境配置错误，应用退出')
      process.exit(1)
    }

    // 开发环境使用默认值继续运行
    console.warn('\n⚠️  使用开发环境默认配置继续运行...')
    return envSchema.parse({
      NODE_ENV: 'development',
      DATABASE_URL: developmentDefaults.DATABASE_URL,
      JWT_SECRET: developmentDefaults.JWT_SECRET,
      CORS_ORIGIN: developmentDefaults.CORS_ORIGIN,
      PORT: process.env.PORT || 3000,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    })
  }
}

// 导出验证后的环境变量
export const env = validateEnv()

// 导出环境变量类型
export type Env = z.infer<typeof envSchema>

// 辅助函数：检查环境
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'

// 辅助函数：获取API URL（用于前端）
export function getApiUrl(): string {
  if (isDevelopment) {
    return `http://localhost:${env.PORT}`
  }
  // 生产环境需要从环境变量获取或使用相对路径
  return ''
}

// 启动时显示数据库配置信息
if (isDevelopment) {
  const dbInfo = getDatabaseInfo()
  console.log(`📊 数据库配置: ${dbInfo.provider} (${dbInfo.mode}模式)`)
  if (dbInfo.provider === 'sqlite') {
    console.log(`   📁 文件路径: ${dbInfo.path}`)
  } else {
    console.log(`   🗄️  数据库: ${dbInfo.database}@${dbInfo.host}:${dbInfo.port}`)
  }
}

if (isProduction) {
  const dbInfo = getDatabaseInfo()
  console.log(`🚀 生产环境启动`)
  console.log(`📊 数据库: PostgreSQL (固定连接)`)
  console.log(`   🗄️  数据库: ${dbInfo.database}@${dbInfo.host}:${dbInfo.port}`)
  console.log(`   🔒 连接: Docker Compose内部网络`)
}
