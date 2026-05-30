#!/usr/bin/env bash
# osint-pipeline.sh — Pipeline de reconocimiento OSINT automatizado
# Uso: ./osint-pipeline.sh <dominio> [--passive-only]
set -euo pipefail

TARGET="${1:-}"
MODE="${2:-}"
PASSIVE_ONLY=false
[ "$MODE" = "--passive-only" ] && PASSIVE_ONLY=true

if [ -z "$TARGET" ]; then
    echo "Uso: $0 <dominio> [--passive-only]"
    echo "  --passive-only : solo fuentes pasivas (sin interacción directa)"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTDIR="reports/${TIMESTAMP}_${TARGET}"
mkdir -p "$OUTDIR"

# ── Helpers ──────────────────────────────────────────────────────────────────
log()  { echo "[$(date +%H:%M:%S)] $*" | tee -a "$OUTDIR/pipeline.log"; }
ok()   { echo "[+] $*" | tee -a "$OUTDIR/pipeline.log"; }
warn() { echo "[!] $*" | tee -a "$OUTDIR/pipeline.log"; }
check_tool() { command -v "$1" &>/dev/null || { warn "Tool not found: $1 (skipping)"; return 1; }; return 0; }

echo "════════════════════════════════════════════"
echo "  LabThinkTank — OSINT Pipeline"
echo "  Target : $TARGET"
echo "  Mode   : $([ "$PASSIVE_ONLY" = true ] && echo PASSIVE || echo ACTIVE)"
echo "  Output : $OUTDIR"
echo "════════════════════════════════════════════"
echo ""

# ── Fase 1: DNS & WHOIS ───────────────────────────────────────────────────────
log "Fase 1 — DNS & WHOIS"

whois "$TARGET" > "$OUTDIR/whois.txt" 2>/dev/null || true
ok "WHOIS → $OUTDIR/whois.txt"

for record in A AAAA MX NS TXT SOA; do
    dig "$TARGET" "$record" +short 2>/dev/null >> "$OUTDIR/dns_${record}.txt" || true
done
cat "$OUTDIR"/dns_*.txt > "$OUTDIR/dns_all.txt"
ok "DNS records → $OUTDIR/dns_*.txt"

# crt.sh — subdominios via Certificate Transparency
log "Certificate Transparency (crt.sh)..."
curl -s "https://crt.sh/?q=%.${TARGET}&output=json" 2>/dev/null \
    | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    names = {e['name_value'].strip().lstrip('*.') for e in data if 'name_value' in e}
    [print(n) for n in sorted(names) if '\\n' not in n]
except: pass
" > "$OUTDIR/crt_sh_subdomains.txt" 2>/dev/null || true
ok "crt.sh → $(wc -l < "$OUTDIR/crt_sh_subdomains.txt") subdominios"

# ── Fase 2: Subdomain enumeration ─────────────────────────────────────────────
log "Fase 2 — Subdomain enumeration"

if check_tool subfinder; then
    subfinder -d "$TARGET" -silent -o "$OUTDIR/subfinder.txt" 2>/dev/null || true
    ok "subfinder → $(wc -l < "$OUTDIR/subfinder.txt") subdominios"
fi

if check_tool amass && [ "$PASSIVE_ONLY" = true ]; then
    amass enum --passive -d "$TARGET" -o "$OUTDIR/amass.txt" 2>/dev/null || true
    ok "amass (passive) → $(wc -l < "$OUTDIR/amass.txt") subdominios"
elif check_tool amass; then
    amass enum -active -d "$TARGET" -o "$OUTDIR/amass.txt" 2>/dev/null || true
    ok "amass (active) → $(wc -l < "$OUTDIR/amass.txt") subdominios"
fi

# Consolidar y deduplicar subdominios
cat "$OUTDIR"/subfinder.txt \
    "$OUTDIR"/amass.txt \
    "$OUTDIR"/crt_sh_subdomains.txt \
    2>/dev/null | sort -u > "$OUTDIR/subdomains_all.txt"
ok "Total subdominios únicos: $(wc -l < "$OUTDIR/subdomains_all.txt")"

# ── Fase 3: Email harvesting ───────────────────────────────────────────────────
log "Fase 3 — Email harvesting"

if check_tool theHarvester; then
    theHarvester -d "$TARGET" -b crtsh,dnsdumpster,hackertarget \
        -f "$OUTDIR/theharvester" 2>/dev/null || true
    ok "theHarvester → $OUTDIR/theharvester.json"
fi

# ── Fase 4: HTTP probing ───────────────────────────────────────────────────────
log "Fase 4 — HTTP probing de subdominios activos"

if check_tool httpx; then
    httpx -l "$OUTDIR/subdomains_all.txt" \
        -title -status-code -tech-detect \
        -silent -json \
        -o "$OUTDIR/httpx_results.json" 2>/dev/null || true

    # Extraer solo los vivos (texto plano)
    python3 -c "
import json, sys
with open('$OUTDIR/httpx_results.json') as f:
    for line in f:
        try:
            d = json.loads(line)
            sc = d.get('status_code', 0)
            url = d.get('url', '')
            title = d.get('title', '')
            tech = ','.join(d.get('tech', []))
            print(f'{sc}  {url}  [{title}]  {tech}')
        except: pass
" > "$OUTDIR/httpx_vivos.txt" 2>/dev/null || true

    VIVOS=$(wc -l < "$OUTDIR/httpx_vivos.txt")
    ok "httpx → $VIVOS hosts HTTP activos"
fi

# ── Fase 5: Vulnerability scan (activo) ───────────────────────────────────────
if [ "$PASSIVE_ONLY" = false ]; then
    log "Fase 5 — Vulnerability scan (nuclei)"

    if check_tool nuclei; then
        nuclei -l "$OUTDIR/httpx_vivos.txt" \
            -severity medium,high,critical \
            -o "$OUTDIR/nuclei_findings.txt" \
            -silent 2>/dev/null || true
        ok "nuclei → $(wc -l < "$OUTDIR/nuclei_findings.txt") hallazgos"
    fi
fi

# ── Fase 6: Generar reporte Markdown ──────────────────────────────────────────
log "Generando reporte..."

cat > "$OUTDIR/report.md" <<REPORT
# OSINT Report — ${TARGET}

**Fecha:** $(date '+%Y-%m-%d %H:%M')
**Modo:** $([ "$PASSIVE_ONLY" = true ] && echo "Pasivo" || echo "Activo")

---

## Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Subdominios descubiertos | $(wc -l < "$OUTDIR/subdomains_all.txt") |
| Hosts HTTP activos | $(wc -l < "$OUTDIR/httpx_vivos.txt" 2>/dev/null || echo 0) |
| Hallazgos nuclei | $(wc -l < "$OUTDIR/nuclei_findings.txt" 2>/dev/null || echo 0) |

---

## DNS

\`\`\`
$(cat "$OUTDIR/dns_all.txt" 2>/dev/null | head -20)
\`\`\`

---

## Subdominios (top 20)

\`\`\`
$(head -20 "$OUTDIR/subdomains_all.txt" 2>/dev/null)
\`\`\`

---

## Hosts HTTP activos

\`\`\`
$(cat "$OUTDIR/httpx_vivos.txt" 2>/dev/null | head -20)
\`\`\`

---

## Hallazgos de vulnerabilidad

\`\`\`
$(cat "$OUTDIR/nuclei_findings.txt" 2>/dev/null | head -30)
\`\`\`

---

*Generado por LabThinkTank OSINT Pipeline*
REPORT

ok "Reporte → $OUTDIR/report.md"

# ── Resumen final ──────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo "  OSINT COMPLETADO: $TARGET"
echo "════════════════════════════════════════════"
echo "  Directorio: $OUTDIR"
echo "  Archivos:"
ls -lh "$OUTDIR" | awk '{print "    " $NF, $5}'
echo ""
