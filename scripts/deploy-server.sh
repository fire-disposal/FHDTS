#!/bin/bash
set -e

# ============================================
# 服务器部署脚本
# 功能：在服务器上拉取最新镜像并重启容器
# 使用：在服务器上运行 ./scripts/deploy-server.sh
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "命令 $1 未找到"
        exit 1
    fi
}

# 检查必需命令
check_commands() {
    log_info "检查必需命令..."
    check_command docker
    check_command docker-compose
    check_command curl
}

# 部署应用
deploy() {
    log_info "开始部署..."

    # 切换到应用目录
    cd /opt/digital-twin || {
        log_error "应用目录不存在: /opt/digital-twin"
        log_error "请先创建目录并配置docker-compose.yml"
        exit 1
    }

    # 拉取最新镜像
    log_info "拉取最新Docker镜像..."
    docker compose pull app || {
        log_error "拉取镜像失败"
        exit 1
    }

    # 重启应用容器（保持数据库运行）
    log_info "重启应用容器..."
    docker compose up -d --no-deps app || {
        log_error "重启容器失败"
        exit 1
    }

    # 清理旧镜像
    log_info "清理未使用的Docker镜像..."
    docker image prune -f

    # 等待应用启动
    log_info "等待应用启动..."
    sleep 10

    # 验证部署
    log_info "验证部署..."
    if curl -s -f http://localhost:3000/api/health > /dev/null; then
        log_info "✅ 部署成功"
        log_info "应用运行在: http://localhost:3000"
    else
        log_error "❌ 部署验证失败"
        log_error "查看日志: docker compose logs app"
        exit 1
    fi
}

# 显示帮助
show_help() {
    echo "服务器部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help    显示帮助信息"
    echo "  --setup       初始服务器设置"
    echo ""
    echo "示例:"
    echo "  $0             # 部署最新版本"
    echo "  $0 --setup     # 初始服务器设置"
}

# 初始服务器设置
setup_server() {
    log_info "初始服务器设置..."

    # 创建应用目录
    sudo mkdir -p /opt/digital-twin
    sudo chown -R $(whoami):$(whoami) /opt/digital-twin

    # 创建docker-compose.yml
    log_info "创建docker-compose.yml..."
    cat > /opt/digital-twin/docker-compose.yml << 'EOF'
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: digital-twin-db
    environment:
      POSTGRES_USER: digitaltwin
      POSTGRES_PASSWORD: digitaltwin_prod_password
      POSTGRES_DB: digitaltwin
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U digitaltwin"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - internal
    restart: unless-stopped

  app:
    image: ghcr.io/firedisposal/digital-twin:latest
    container_name: digital-twin-app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - internal

networks:
  internal:
    driver: bridge

volumes:
  postgres_data:
EOF

    # 创建.env文件模板
    log_info "创建.env文件模板..."
    cat > /opt/digital-twin/.env.example << 'EOF'
# FHDTS 环境变量配置
# 复制此文件为 .env 并修改配置

# JWT 签名密钥（必须设置）
# 生成命令：openssl rand -base64 32
JWT_SECRET=your-production-jwt-secret-here-minimum-32-characters

# JWT 过期时间
JWT_EXPIRES_IN=7d

# CORS 允许的源
CORS_ORIGIN=*

# 应用设置
PORT=3000
EOF

    log_info "✅ 服务器设置完成"
    echo ""
    log_info "下一步操作："
    log_info "1. 编辑 /opt/digital-twin/.env 文件，设置 JWT_SECRET"
    log_info "2. 首次启动: cd /opt/digital-twin && docker compose up -d"
    log_info "3. 后续部署: ./scripts/deploy-server.sh"
}

# 主函数
main() {
    local action="deploy"

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --setup)
                action="setup"
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    check_commands

    case $action in
        setup)
            setup_server
            ;;
        deploy)
            deploy
            ;;
    esac
}

# 运行主函数
main "$@"
