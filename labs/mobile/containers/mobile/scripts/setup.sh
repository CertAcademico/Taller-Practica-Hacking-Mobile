#!/usr/bin/env bash
# setup.sh — Levanta el laboratorio mobile y espera a que el emulador arranque
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "$0")/.." && pwd)/docker-compose.yml"
TIMEOUT=180

echo "╔══════════════════════════════════════════╗"
echo "║    LabThinkTank — Mobile Hacking Lab      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Build + up ─────────────────────────────────────────────────────────────
echo "[*] Construyendo imágenes..."
docker compose -f "$COMPOSE_FILE" build --quiet

echo "[*] Levantando servicios..."
docker compose -f "$COMPOSE_FILE" up -d

# ── Esperar emulador ────────────────────────────────────────────────────────
echo "[*] Esperando que el emulador Android arranque (puede tardar ~2 min)..."
elapsed=0
until docker exec mobile-android adb devices 2>/dev/null | grep -q "emulator"; do
    if [ $elapsed -ge $TIMEOUT ]; then
        echo "[!] Timeout esperando el emulador. Revisa: docker logs mobile-android"
        exit 1
    fi
    printf "."
    sleep 5
    elapsed=$((elapsed + 5))
done
echo ""

# ── Conectar ADB desde host ─────────────────────────────────────────────────
echo "[*] Conectando ADB al emulador..."
adb connect localhost:5555 2>/dev/null || echo "    (ADB en host no disponible, usa el container mobile-tools)"

# ── Info de acceso ──────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Servicios disponibles:                   ║"
echo "║                                           ║"
echo "║  Android (noVNC)  →  http://localhost:6080║"
echo "║  MobSF            →  http://localhost:8000║"
echo "║  ADB TCP          →  localhost:5555       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "[*] Para acceder a las herramientas:"
echo "    docker exec -it mobile-tools bash"
echo ""
echo "[*] Para instalar un APK:"
echo "    adb -s localhost:5555 install vulnerable-apps/diva-android/diva-beta.apk"
