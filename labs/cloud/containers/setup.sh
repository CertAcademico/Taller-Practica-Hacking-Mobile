#!/usr/bin/env bash
# setup.sh — Levanta el laboratorio de Cloud Security
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "$0")" && pwd)/docker-compose.yml"
TIMEOUT=90

echo "╔══════════════════════════════════════════╗"
echo "║   LabThinkTank — Cloud Security Lab       ║"
echo "╚══════════════════════════════════════════╝"

echo "[*] Construyendo imagen cloud-tools..."
docker compose -f "$COMPOSE_FILE" build --quiet

echo "[*] Levantando servicios..."
docker compose -f "$COMPOSE_FILE" up -d

echo "[*] Esperando LocalStack (~30s)..."
elapsed=0
until curl -s http://localhost:4566/_localstack/health \
    | grep -q '"s3": "running"'; do
    if [ $elapsed -ge $TIMEOUT ]; then
        echo "[!] Timeout. Revisa: docker logs cloud-localstack"
        exit 1
    fi
    printf "."
    sleep 5
    elapsed=$((elapsed + 5))
done
echo ""

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Servicios disponibles:                       ║"
echo "║                                               ║"
echo "║  LocalStack  →  http://localhost:4566         ║"
echo "║  SSRF App    →  http://localhost:8181         ║"
echo "║  IMDS Mock   →  http://localhost:8169         ║"
echo "║                                               ║"
echo "║  Credenciales LocalStack:                     ║"
echo "║    AWS_ACCESS_KEY_ID=test                     ║"
echo "║    AWS_SECRET_ACCESS_KEY=test                 ║"
echo "║    Region: us-east-1                          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "[*] Entrar al container de herramientas:"
echo "    docker exec -it cloud-tools bash"
echo ""
echo "[*] Test rápido:"
echo "    aws --endpoint-url http://localhost:4566 s3 ls"
