# Lab 05 — Pipeline de Automatización OSINT

## Objetivo

Encadenar todas las herramientas vistas en los labs anteriores en un pipeline automatizado que ejecute reconocimiento completo y genere un reporte Markdown con los hallazgos.

---

## El pipeline

El script `automation/osint/osint-pipeline.sh` ejecuta las siguientes fases en secuencia:

```
Fase 1: DNS & WHOIS
   └── whois, dig (A/AAAA/MX/NS/TXT/SOA), crt.sh
         ↓
Fase 2: Subdomain Enumeration
   └── subfinder + amass + crt.sh → deduplicar → subdomains_all.txt
         ↓
Fase 3: Email Harvesting
   └── theHarvester (crtsh + dnsdumpster + hackertarget)
         ↓
Fase 4: HTTP Probing
   └── httpx (title + status + tech-detect) → httpx_vivos.txt
         ↓
Fase 5: Vulnerability Scan  [solo en modo activo]
   └── nuclei (medium/high/critical) → nuclei_findings.txt
         ↓
Fase 6: Reporte Markdown
   └── report.md con resumen ejecutivo + tablas
```

---

## Uso

```bash
# Modo activo completo
./automation/osint/osint-pipeline.sh scanme.nmap.org

# Solo fuentes pasivas (sin interacción directa con el objetivo)
./automation/osint/osint-pipeline.sh scanme.nmap.org --passive-only

# Desde el container Docker
docker compose -f labs/osint/containers/docker-compose.yml \
    run --rm osint-tools \
    bash /workspace/automation/osint/osint-pipeline.sh scanme.nmap.org
```

### Output

```
reports/
└── 20260710_143022_scanme.nmap.org/
    ├── pipeline.log          ← log de ejecución con timestamps
    ├── whois.txt
    ├── dns_A.txt
    ├── dns_MX.txt
    ├── dns_TXT.txt
    ├── dns_all.txt
    ├── crt_sh_subdomains.txt
    ├── subfinder.txt
    ├── amass.txt
    ├── subdomains_all.txt    ← consolidado y deduplicado
    ├── theharvester.json
    ├── httpx_results.json
    ├── httpx_vivos.txt       ← hosts HTTP activos con título y tech
    ├── nuclei_findings.txt   ← vulnerabilidades detectadas
    └── report.md             ← reporte final
```

---

## Parte 1 — Ejecutar el pipeline

```bash
# 1. Entrar al container OSINT
docker compose -f labs/osint/containers/docker-compose.yml \
    run --rm -v $(pwd):/workspace osint-tools bash

# 2. Ejecutar el pipeline
cd /workspace
./automation/osint/osint-pipeline.sh scanme.nmap.org --passive-only

# 3. Ver el reporte
cat reports/*/report.md
```

---

## Parte 2 — Interpretar los resultados

### httpx_vivos.txt

```
200  https://www.nmap.org         [Nmap - the Network Mapper]           Apache,PHP
200  https://svn.nmap.org         [SVN Repository]                      Apache
403  https://mail.nmap.org        []                                     nginx
200  https://nmap.org             [Nmap - the Network Mapper - Free...] Apache,PHP
```

- `200` en rutas de admin → investigar más
- `403` → existe pero bloqueado → intentar bypass
- Tecnología visible → buscar CVEs para esa versión

### nuclei_findings.txt

```
[CVE-2021-41773] [http] [critical] http://192.168.1.10/cgi-bin/.%2e/.%2e/bin/sh
[missing-csp] [http] [info] https://nmap.org (Content-Security-Policy)
[http-missing-security-headers] [http] [info] https://nmap.org
```

- `critical`/`high` → reportar inmediatamente
- `info` → bajo riesgo, pero documentar

---

## Parte 3 — Personalizar el pipeline

### Añadir nuevas fuentes a subfinder

```yaml
# ~/.config/subfinder/provider-config.yaml
virustotal:
  - TU_API_KEY
shodan:
  - TU_API_KEY
```

### Añadir Shodan al pipeline

```bash
# Después de la fase de DNS, añadir:
if check_tool shodan; then
    shodan search "hostname:${TARGET}" --fields ip_str,port,product \
        --limit 50 > "$OUTDIR/shodan.txt" 2>/dev/null || true
    ok "Shodan → $OUTDIR/shodan.txt"
fi
```

### Añadir screenshots con gowitness

```bash
# Instalar
go install github.com/sensepost/gowitness@latest

# Añadir al pipeline (después de httpx)
if check_tool gowitness; then
    mkdir -p "$OUTDIR/screenshots"
    gowitness file -f "$OUTDIR/httpx_vivos.txt" \
        --screenshot-path "$OUTDIR/screenshots" 2>/dev/null || true
    ok "Screenshots → $OUTDIR/screenshots/"
fi
```

---

## Parte 4 — Programar ejecución periódica

Para monitorear cambios en la infraestructura del objetivo:

```bash
# Cron: ejecutar cada lunes a las 8am
crontab -e
0 8 * * 1 /ruta/al/automation/osint/osint-pipeline.sh empresa.com --passive-only >> /var/log/osint.log 2>&1

# Comparar con ejecución anterior
diff reports/20260703_*/subdomains_all.txt \
     reports/20260710_*/subdomains_all.txt
# Nuevo subdominio = posible nuevo activo = nueva superficie de ataque
```

---

## Actividades

1. Ejecutar el pipeline completo contra `scanme.nmap.org`
2. Revisar el `report.md` generado e interpretar cada sección
3. Añadir al pipeline la búsqueda en `crt.sh` de subdominios con wildcard (`*.scanme.nmap.org`)
4. Modificar el pipeline para añadir gowitness screenshots
5. Comparar resultados de dos ejecuciones y documentar diferencias

---

## Referencias

- [ProjectDiscovery Tools](https://github.com/projectdiscovery)
- [Gowitness](https://github.com/sensepost/gowitness)
- [Axiom — distributed OSINT](https://github.com/pry0cc/axiom)
- [ReconFTW — pipeline completo](https://github.com/six2dez/reconftw)
