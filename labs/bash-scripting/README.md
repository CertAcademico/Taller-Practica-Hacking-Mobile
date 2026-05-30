# Lab — Bash Scripting

Automatización ofensiva con Bash: construcción de pipelines de reconocimiento, parsing de salidas de herramientas y scripting de workflows de pentesting.

---

## Objetivos

- Escribir scripts bash robustos con manejo de errores
- Automatizar workflows de recon (nmap → subfinder → nuclei)
- Parsear salidas de herramientas con grep/awk/sed
- Construir reportes automáticos en texto plano
- Parametrizar herramientas desde la línea de comandos

---

## Parte 1 — Estructura de un script

```bash
#!/usr/bin/env bash
# descripcion: script de ejemplo
set -euo pipefail   # e=salir en error, u=variables no definidas, o pipefail

TARGET="${1:-}"     # primer argumento, vacío si no se pasa

if [ -z "$TARGET" ]; then
    echo "Uso: $0 <target>"
    exit 1
fi

echo "[*] Iniciando en: $TARGET"
```

### Buenas prácticas

| Práctica | Por qué |
|---------|---------|
| `set -euo pipefail` | Evita que errores silenciosos continúen |
| Comillas en variables `"$VAR"` | Evita word-splitting con espacios |
| `${VAR:-default}` | Valor por defecto si la variable está vacía |
| Funciones para cada tarea | Reutilización y legibilidad |
| `2>/dev/null` | Suprimir errores esperados |

---

## Parte 2 — Variables, condicionales y bucles

```bash
# Variables
OBJETIVO="192.168.1.10"
PUERTO=80
REPORTE="reports/${OBJETIVO}"

# Condicional
if [ -f "$REPORTE/nmap.txt" ]; then
    echo "[+] Ya existe reporte de nmap"
else
    echo "[-] No hay reporte previo"
fi

# Bucle sobre lista
for puerto in 22 80 443 445 3306; do
    nc -z -w1 "$OBJETIVO" "$puerto" 2>/dev/null && echo "[+] $puerto abierto"
done

# Bucle sobre archivo
while IFS= read -r host; do
    ping -c 1 -W 1 "$host" &>/dev/null && echo "[+] $host vivo"
done < hosts.txt

# Bucle con find
find /var/log -name "*.log" -newer /tmp/marker | while read -r archivo; do
    echo "Nuevo log: $archivo"
done
```

---

## Parte 3 — Funciones

```bash
#!/usr/bin/env bash
set -euo pipefail

log()    { echo "[*] $*"; }
ok()     { echo "[+] $*"; }
warn()   { echo "[!] $*" >&2; }
fail()   { echo "[ERROR] $*" >&2; exit 1; }

check_tool() {
    local tool="$1"
    command -v "$tool" &>/dev/null || fail "Herramienta no encontrada: $tool"
}

scan_host() {
    local target="$1"
    local outdir="$2"
    mkdir -p "$outdir"
    log "Escaneando $target..."
    nmap -sV -T4 "$target" -oN "$outdir/nmap.txt" 2>/dev/null
    ok "Scan completo → $outdir/nmap.txt"
}

# Main
TARGET="${1:-}"
[ -z "$TARGET" ] && fail "Uso: $0 <target>"

check_tool nmap
scan_host "$TARGET" "reports/$TARGET"
```

---

## Parte 4 — Parsing de salidas

### Extraer IPs de un scan nmap

```bash
# Hosts activos de un scan -sn
nmap -sn 192.168.1.0/24 | grep "Nmap scan report" | awk '{print $NF}' | tr -d '()'

# Puertos abiertos de un .nmap
grep "^[0-9]" resultado.txt | awk '{print $1}' | cut -d/ -f1

# Servicios detectados
grep "open" resultado.txt | awk '{print $1, $3, $4}'
```

### Parsear con grep + awk

```bash
# Extraer emails de una página
curl -s http://objetivo.com | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

# Extraer URLs
curl -s http://objetivo.com | grep -oE 'https?://[^"]+' | sort -u

# Extraer IPs de un log
grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' access.log | sort | uniq -c | sort -rn | head -20

# Contar códigos HTTP en un log
awk '{print $9}' access.log | sort | uniq -c | sort -rn
```

### sed para transformar salidas

```bash
# Añadir http:// a lista de dominios
sed 's/^/http:\/\//' subdominios.txt

# Eliminar líneas vacías
sed '/^$/d' archivo.txt

# Extraer solo IPs (quitar texto circundante)
sed -n 's/.*(\([0-9.]*\)).*/\1/p' nmap_output.txt
```

---

## Parte 5 — Pipeline de reconocimiento

Script completo que encadena nmap → subfinder → httpx → nuclei:

```bash
#!/usr/bin/env bash
# recon-pipeline.sh — Pipeline ofensivo automatizado
set -euo pipefail

TARGET="${1:-}"
[ -z "$TARGET" ] && { echo "Uso: $0 <dominio|IP>"; exit 1; }

OUTDIR="reports/$(date +%Y%m%d)_${TARGET}"
mkdir -p "$OUTDIR"

log()  { echo "[$(date +%H:%M:%S)] $*"; }
ok()   { echo "[+] $*"; }

# 1. Port scan
log "Fase 1 — Port scan"
nmap -sV -T4 --open "$TARGET" -oN "$OUTDIR/nmap.txt" 2>/dev/null
ok "Nmap → $OUTDIR/nmap.txt"

# 2. Subdominios (solo si es dominio, no IP)
if echo "$TARGET" | grep -qE '[a-zA-Z]'; then
    log "Fase 2 — Subdomain enumeration"
    subfinder -d "$TARGET" -silent -o "$OUTDIR/subdominios.txt" 2>/dev/null || true
    ok "Subfinder → $(wc -l < "$OUTDIR/subdominios.txt") subdominios"

    # 3. Verificar cuáles responden HTTP
    log "Fase 3 — HTTP probing"
    httpx -l "$OUTDIR/subdominios.txt" -silent -o "$OUTDIR/http_vivos.txt" 2>/dev/null || true
    ok "httpx → $(wc -l < "$OUTDIR/http_vivos.txt") hosts activos"

    # 4. Nuclei sobre hosts vivos
    log "Fase 4 — Vulnerability scan"
    nuclei -l "$OUTDIR/http_vivos.txt" -severity medium,high,critical \
           -o "$OUTDIR/nuclei.txt" -silent 2>/dev/null || true
    ok "Nuclei → $OUTDIR/nuclei.txt"
fi

# Resumen
echo ""
echo "================================================"
echo "  RECON COMPLETO: $TARGET"
echo "  Directorio:     $OUTDIR"
echo "================================================"
ls -lh "$OUTDIR"
```

```bash
# Ejecutar
chmod +x recon-pipeline.sh
./recon-pipeline.sh ejemplo.com
```

---

## Parte 6 — Utilidades rápidas

```bash
# Port scanner simple en bash puro (sin nmap)
for puerto in $(seq 1 1024); do
    (echo >/dev/tcp/192.168.1.10/$puerto) 2>/dev/null && echo "$puerto abierto"
done

# Ping sweep en bash puro
for i in $(seq 1 254); do
    ping -c 1 -W 1 "192.168.1.$i" &>/dev/null && echo "192.168.1.$i vivo" &
done; wait

# Verificar si un puerto está abierto (para scripts)
check_port() {
    nc -z -w2 "$1" "$2" 2>/dev/null && return 0 || return 1
}
check_port 192.168.1.10 80 && echo "Puerto 80 abierto"

# Generar wordlist de subdominios desde una empresa
company="empresa"
for prefix in www mail vpn ftp admin api dev staging test; do
    echo "${prefix}.${company}.com"
done
```

---

## Actividades

1. Escribir un script que reciba un rango CIDR y devuelva los hosts activos
2. Parsear la salida de `nmap -sV` y extraer solo los servicios en versiones vulnerables
3. Construir un one-liner que descubra subdominios y compruebe si tienen panel de login
4. Automatizar el pipeline completo: scan → subdominios → screenshots con `gowitness`
5. Generar un reporte en Markdown con los hallazgos de un scan

---

## Referencias

- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
- [ShellCheck](https://www.shellcheck.net/) — linter para scripts bash
- [Offensive Bash — HackTricks](https://book.hacktricks.xyz/linux-hardening/useful-linux-commands)
- [ProjectDiscovery Tools](https://github.com/projectdiscovery)
