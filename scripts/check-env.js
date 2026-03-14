#!/usr/bin/env node

/**
 * CICD环境检查脚本
 * 专注于验证CICD和Docker部署所需的环境配置
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function check(name, condition, message = '') {
  const icon = condition ? '✓' : '✗'
  const color = condition ? colors.green : colors.red
  console.log(`${color}${icon} ${name}${colors.reset} ${message}`)
  return condition
}

async function main() {
  console.log(`${colors.bold}${colors.cyan}🔧 CICD环境检查${colors.reset}\n`)

  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProduction = nodeEnv === 'production'

  log(`环境: ${nodeEnv}`, colors.bold)
  log(`Node版本: ${process.version}`)

  let allChecksPassed = true

  // 1. Node.js版本检查 (CICD需要)
  console.log(`\n${colors.cyan}📦 运行时检查:${colors.reset}`)
  const nodeMajor = parseInt(process.version.replace('v', '').split('.')[0])
  const nodeOk = check('Node.js版本', nodeMajor >= 20, `v${nodeMajor}.x.x`)
  allChecksPassed = allChecksPassed && nodeOk

  // 2. 包管理器检查 (CICD需要)
  let pnpmOk = false
  try {
    execSync('pnpm --version', { stdio: 'pipe' })
    pnpmOk = check('PNPM', true, '已安装')
  } catch {
    pnpmOk = check('PNPM', false, '未安装')
  }
  allChecksPassed = allChecksPassed && pnpmOk

  // 3. 生产环境特定检查
  if (isProduction) {
    console.log(`\n${colors.cyan}🚀 生产环境检查:${colors.reset}`)

    // JWT密钥检查
    const hasJwtSecret = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
    const jwtOk = check('JWT_SECRET', hasJwtSecret, hasJwtSecret ? '已设置' : '必须设置(≥32字符)')
    allChecksPassed = allChecksPassed && jwtOk

    if (!hasJwtSecret) {
      log('  生成命令: openssl rand -base64 32', colors.yellow)
    }
  }

  // 4. Docker Compose配置检查
  console.log(`\n${colors.cyan}🐳 Docker配置检查:${colors.reset}`)
  try {
    const composePath = join(__dirname, '../docker-compose.yml')
    const composeContent = readFileSync(composePath, 'utf-8')

    const hasPostgres = composeContent.includes('postgres:')
    const hasApp = composeContent.includes('digital-twin:')

    const composeOk = check('docker-compose.yml', hasPostgres && hasApp, '配置完整')
    allChecksPassed = allChecksPassed && composeOk
  } catch (error) {
    const composeOk = check('docker-compose.yml', false, '文件不存在或无法读取')
    allChecksPassed = allChecksPassed && composeOk
  }

  // 5. Dockerfile检查
  console.log(`\n${colors.cyan}🏗️  构建配置检查:${colors.reset}`)
  try {
    const dockerfilePath = join(__dirname, '../docker/Dockerfile')
    const dockerfileContent = readFileSync(dockerfilePath, 'utf-8')

    const hasNode24 = dockerfileContent.includes('node:24')
    const hasMultiStage = dockerfileContent.includes('AS builder')

    const dockerfileOk = check('Dockerfile', hasNode24 && hasMultiStage, '多阶段构建配置正确')
    allChecksPassed = allChecksPassed && dockerfileOk
  } catch (error) {
    const dockerfileOk = check('Dockerfile', false, '文件不存在或无法读取')
    allChecksPassed = allChecksPassed && dockerfileOk
  }

  // 6. 项目构建检查
  console.log(`\n${colors.cyan}🔨 项目构建检查:${colors.reset}`)
  try {
    const packagePath = join(__dirname, '../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    const hasBuildScript = packageJson.scripts && packageJson.scripts.build
    const hasTurbo = packageJson.devDependencies && packageJson.devDependencies.turbo

    const buildOk = check('构建配置', hasBuildScript && hasTurbo, 'TurboRepo配置正确')
    allChecksPassed = allChecksPassed && buildOk
  } catch (error) {
    const buildOk = check('构建配置', false, '配置文件读取失败')
    allChecksPassed = allChecksPassed && buildOk
  }

  // 总结
  console.log(`\n${colors.bold}${colors.cyan}📊 检查结果:${colors.reset}`)

  if (allChecksPassed) {
    if (isProduction) {
      log('✅ 生产环境CICD检查通过', colors.green)
      log('   可以安全部署到Docker环境', colors.green)
    } else {
      log('✅ 开发环境CICD检查通过', colors.green)
      log('   可以运行构建和测试', colors.green)
    }
  } else {
    log('❌ CICD环境检查未通过', colors.red)
    log('   请修复上述问题后再继续', colors.red)
    process.exit(1)
  }

  // CICD建议
  console.log(`\n${colors.cyan}💡 CICD建议:${colors.reset}`)
  if (isProduction) {
    log('1. 确保GitHub Secrets已配置:')
    log('   - DEPLOY_HOST, DEPLOY_USER, DEPLOY_KEY')
    log('   - JWT_SECRET (必须)')
    log('2. 推送代码到main分支触发自动部署')
    log('3. 部署后验证: curl http://服务器:3000/api/health')
  } else {
    log('1. 运行构建: pnpm build')
    log('2. 运行测试: pnpm --filter server test')
    log('3. 本地开发: pnpm dev')
  }
}

// 执行检查
main().catch(error => {
  console.error(`${colors.red}检查失败:${colors.reset}`, error.message)
  process.exit(1)
})
