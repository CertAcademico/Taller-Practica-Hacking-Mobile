#!/usr/bin/env bash
# recon.sh — LabThinkTank Offensive Recon Pipeline
# Uso: ./recon.sh <target> [--quiet]
set -euo pipefail

TARGET="${1:-}"
QUIET="${2:-}"

if [ -z "$TARGET" ]; then
    echo "Uso: $0 <target> [--quiet]"
    exit 1
fi

REPORT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/reports/$TARGET"
mkdir -p "$REPORT_DIR"

banner() { [ "$QUIET" = "--quiet" ] || echo "$1"; }

banner "========================================="
banner " LabThinkTank Offensive Recon Pipeline"
banner "========================================="
banner "[+] Target: $TARGET"
banner "[+] Reports: $REPORT_DIR"
banner ""

banner "[+] Running Nmap..."
nmap -sC -sV "$TARGET" -oN "$REPORT_DIR/nmap.txt"

banner "[+] Running WhatWeb..."
whatweb "http://$TARGET" > "$REPORT_DIR/whatweb.txt" 2>&1 || true

banner "[+] Running Dirsearch..."
dirsearch -u "http://$TARGET" -o "$REPORT_DIR/dirsearch.txt" 2>/dev/null || true

banner ""
banner "[+] Recon completed. Results in: $REPORT_DIR"
