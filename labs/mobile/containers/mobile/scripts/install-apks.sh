#!/usr/bin/env bash
# install-apks.sh — Instala las APKs vulnerables en el emulador
set -euo pipefail

APKS_DIR="$(cd "$(dirname "$0")/../../.." && pwd)/vulnerable-apps"

connect_adb() {
    adb connect localhost:5555 > /dev/null 2>&1
    sleep 2
}

install_apk() {
    local apk="$1"
    local name
    name=$(basename "$apk")
    echo "[*] Instalando $name..."
    adb -s localhost:5555 install -r "$apk" && echo "    [OK] $name" || echo "    [FAIL] $name"
}

echo "[*] Conectando a emulador..."
connect_adb

echo "[*] Instalando APKs vulnerables..."
while IFS= read -r -d '' apk; do
    install_apk "$apk"
done < <(find "$APKS_DIR" -name "*.apk" -print0)

echo ""
echo "[*] Paquetes instalados:"
adb -s localhost:5555 shell pm list packages -3 | grep -v "^$"
