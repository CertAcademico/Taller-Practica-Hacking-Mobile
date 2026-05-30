#!/usr/bin/env bash
# setup.sh — Levanta el laboratorio de Active Directory
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "$0")" && pwd)/docker-compose.yml"
TIMEOUT=120

echo "╔══════════════════════════════════════════╗"
echo "║   LabThinkTank — Active Directory Lab     ║"
echo "╚══════════════════════════════════════════╝"

echo "[*] Construyendo imágenes..."
docker compose -f "$COMPOSE_FILE" build --quiet

echo "[*] Levantando servicios..."
docker compose -f "$COMPOSE_FILE" up -d

echo "[*] Esperando que el DC esté listo (~60s)..."
elapsed=0
until docker exec ad-dc01 smbclient -L //127.0.0.1 \
    -U "Administrator%Lab@Think2026!" &>/dev/null; do
    if [ $elapsed -ge $TIMEOUT ]; then
        echo "[!] Timeout. Revisa: docker logs ad-dc01"
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
echo "║  BloodHound  →  http://localhost:8080         ║"
echo "║  Neo4j       →  http://localhost:7474         ║"
echo "║                                               ║"
echo "║  Dominio: LABTHINKTANK.LOCAL                  ║"
echo "║  DC IP:   192.168.100.10                      ║"
echo "║                                               ║"
echo "║  Credenciales:                                ║"
echo "║    Administrator / Lab@Think2026!             ║"
echo "║    jgarcia       / Password123!               ║"
echo "║    mlopez        / Summer2024!  (AS-REP)      ║"
echo "║    sql_svc       / sql_service_pass! (SPN)    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "[*] Entrar al container de herramientas:"
echo "    docker exec -it ad-tools bash"
