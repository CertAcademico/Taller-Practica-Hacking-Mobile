#!/usr/bin/env bash
# setup.sh — Levanta el laboratorio de Web Exploitation
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "$0")" && pwd)/docker-compose.yml"
TIMEOUT=120

echo "╔══════════════════════════════════════════╗"
echo "║   LabThinkTank — Web Exploitation Lab     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo "[*] Levantando servicios..."
docker compose -f "$COMPOSE_FILE" up -d dvwa dvwa-db juiceshop webgoat

echo "[*] Esperando DVWA (~30s)..."
elapsed=0
until curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/setup.php 2>/dev/null | grep -q "200\|302"; do
    if [ $elapsed -ge $TIMEOUT ]; then
        echo "[!] Timeout. Revisa: docker logs web-dvwa"
        exit 1
    fi
    printf "."
    sleep 5
    elapsed=$((elapsed + 5))
done
echo ""

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Servicios disponibles:                   ║"
echo "║                                           ║"
echo "║  DVWA         →  http://localhost:8080    ║"
echo "║  Juice Shop   →  http://localhost:3000    ║"
echo "║  WebGoat      →  http://localhost:8888    ║"
echo "║                                           ║"
echo "║  Credenciales DVWA: admin / password      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "[*] Setup inicial DVWA:"
echo "    1. Abrir http://localhost:8080/setup.php"
echo "    2. Click 'Create / Reset Database'"
echo "    3. Login: admin / password"
echo "    4. Ir a DVWA Security → Low"
