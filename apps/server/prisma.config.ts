import 'dotenv/config'

export default {
  // 数据库连接配置
  datasource: {
    db: {
      // 连接URL从环境变量获取
      // 开发环境: file:./dev.db (SQLite)
      // 生产环境: postgresql://digitaltwin:digitaltwin_prod_password@postgres:5432/digitaltwin
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
  },

  // 生成器配置
  generators: [
    {
      name: 'client',
      provider: 'prisma-client-js',
      output: '../node_modules/.prisma/client',
    },
  ],

  // 迁移配置
  migrations: {
    path: './prisma/migrations',
  },

  // Prisma客户端配置
  client: {
    // 数据源配置
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./dev.db',
      },
    },
  },
}
