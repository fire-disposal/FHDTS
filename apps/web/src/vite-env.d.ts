/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * API 基础 URL
   * 开发环境默认: http://localhost:3000
   * 生产环境必须设置
   */
  readonly VITE_API_URL: string

  /**
   * 应用标题
   * 可选，默认: 'Digital Twin'
   */
  readonly VITE_APP_TITLE?: string
}

// 为Vite提供类型支持
interface ImportMeta {
  readonly env: ImportMetaEnv
}
