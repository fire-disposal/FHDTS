/// <reference types="vite/client" />

// ============================================
// Web 环境变量配置
// ============================================
// 说明：
// 1. Vite 要求客户端环境变量必须以 VITE_ 开头
// 2. 开发环境自动使用默认值
// 3. 生产环境必须设置所有变量

// API 基础 URL
// 开发环境默认：http://localhost:3000
// 生产环境需要设置为实际 API 地址
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 应用标题
// 开发环境默认：Digital Twin
// 生产环境可自定义
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Digital Twin'

// 环境检测
export const IS_DEVELOPMENT = import.meta.env.DEV || false
export const IS_PRODUCTION = import.meta.env.PROD || false

// 环境变量验证（开发环境控制台提示）
if (IS_DEVELOPMENT) {
  // 检查必需的 API_URL
  if (!import.meta.env.VITE_API_URL) {
    console.warn('⚠️  环境变量提示: VITE_API_URL 未设置，使用默认值 http://localhost:3000')
    console.info('💡 如需自定义，请在 .env 文件中添加:')
    console.info('   VITE_API_URL=http://your-api-url')
  }

  // 检查 APP_TITLE
  if (!import.meta.env.VITE_APP_TITLE) {
    console.info('ℹ️  应用标题使用默认值: Digital Twin')
    console.info('💡 如需自定义，请在 .env 文件中添加:')
    console.info('   VITE_APP_TITLE=Your App Title')
  }
}

// 生产环境安全检查
if (IS_PRODUCTION) {
  // 确保 API_URL 已设置
  if (!import.meta.env.VITE_API_URL) {
    console.error('❌ 生产环境错误: VITE_API_URL 必须设置')
    // 生产环境继续运行但显示错误
  }
}

// 导出环境变量类型检查
export type WebEnv = {
  VITE_API_URL: string
  VITE_APP_TITLE?: string
}

// 辅助函数：获取完整环境配置
export function getWebEnv(): WebEnv {
  return {
    VITE_API_URL: import.meta.env.VITE_API_URL || '',
    VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
  }
}

// 辅助函数：验证环境变量
export function validateWebEnv(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (IS_PRODUCTION && !import.meta.env.VITE_API_URL) {
    errors.push('VITE_API_URL 必须在生产环境中设置')
  }

  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.startsWith('http')) {
    errors.push('VITE_API_URL 必须是有效的 URL（以 http:// 或 https:// 开头）')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// 开发环境自动验证
if (IS_DEVELOPMENT) {
  const validation = validateWebEnv()
  if (!validation.isValid) {
    console.warn('⚠️  环境变量验证警告:')
    validation.errors.forEach(error => {
      console.warn(`   - ${error}`)
    })
  }
}
