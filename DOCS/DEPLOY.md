# Deploy to Production

## GitHub Secrets Required

| Secret | Description | Default |
|--------|-------------|---------|
| `DEPLOY_HOST` | Server IP or domain | - |
| `DEPLOY_USER` | SSH username | - |
| `DEPLOY_KEY` | SSH private key | - |
| `DEPLOY_PORT` | SSH port | `22` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@postgres:5432/digitaltwin` |

## Deploy Process

1. **Create a new tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions will:**
   - Build the application
   - Push Docker image to GHCR
   - Deploy to server via SSH

## Manual Deploy

```bash
cd /opt/digital-twin
docker compose pull
docker compose up -d
```

## Access

- **Web:** http://server-ip:3000
- **IoT TCP:** server-ip:5858
- **MQTT:** server-ip:1883
- **PostgreSQL:** Internal network only (SSH tunnel required)

### SSH Tunnel to PostgreSQL

```bash
ssh -L 5432:localhost:5432 user@server-ip
# Then connect to postgresql://localhost:5432/digitaltwin
```
