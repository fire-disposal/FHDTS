#!/bin/bash
set -e

echo "🚀 Setting up digital-twin deployment..."

DEPLOY_DIR="/opt/digital-twin"

sudo mkdir -p $DEPLOY_DIR
sudo chown $USER:$USER $DEPLOY_DIR

cd $DEPLOY_DIR

cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/digitaltwin
PORT=3000
NODE_ENV=production
EOF

curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/firedisposal/digital-twin/main/docker-compose.yml

echo "✅ Deployment directory ready at $DEPLOY_DIR"
echo "📝 Next steps:"
echo "   1. docker compose pull"
echo "   2. docker compose up -d"
