#!/usr/bin/env bash
# setup.sh — Levanta el entorno OSINT
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "$0")" && pwd)/docker-compose.yml"

echo "╔══════════════════════════════════════════╗"
echo "║    LabThinkTank — OSINT Lab               ║"
echo "╚══════════════════════════════════════════╝"

echo "[*] Construyendo imagen osint-tools..."
docker compose -f "$COMPOSE_FILE" build --quiet

echo "[*] Levantando SpiderFoot..."
docker compose -f "$COMPOSE_FILE" up -d spiderfoot

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Servicios disponibles:                   ║"
echo "║                                           ║"
echo "║  SpiderFoot   →  http://localhost:5009    ║"
echo "║                                           ║"
echo "║  Para usar herramientas CLI:              ║"
echo "║  docker compose run --rm osint-tools bash ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "[*] Configurar API keys (opcional):"
echo "    mkdir -p containers/config"
echo "    echo 'TU_SHODAN_KEY' > containers/config/shodan.key"
echo "    docker compose run --rm osint-tools shodan init \$(cat /root/.config/shodan.key)"
