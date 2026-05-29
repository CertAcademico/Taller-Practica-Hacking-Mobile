#!/usr/bin/env bash
# frida-push.sh — Descarga y sube frida-server al emulador Android
set -euo pipefail

FRIDA_VERSION="${1:-16.5.9}"
ARCH="x86"   # emulador x86 de docker-android

FRIDA_BIN="frida-server-${FRIDA_VERSION}-android-${ARCH}"
FRIDA_URL="https://github.com/frida/frida/releases/download/${FRIDA_VERSION}/${FRIDA_BIN}.xz"
TMP="/tmp/${FRIDA_BIN}"

echo "[*] Frida version: $FRIDA_VERSION  arch: $ARCH"

if [ ! -f "$TMP" ]; then
    echo "[*] Descargando frida-server..."
    curl -sL "$FRIDA_URL" | xz -d > "$TMP"
    chmod +x "$TMP"
fi

echo "[*] Subiendo al emulador..."
adb -s localhost:5555 push "$TMP" /data/local/tmp/frida-server
adb -s localhost:5555 shell chmod 755 /data/local/tmp/frida-server

echo "[*] Iniciando frida-server en background..."
adb -s localhost:5555 shell "su -c '/data/local/tmp/frida-server &'" &
sleep 2

echo "[*] Verificando..."
frida-ps -H localhost:5555 | head -10 || echo "(frida-ps no disponible en host — usa: docker exec -it mobile-tools frida-ps -H mobile-android:5555)"
