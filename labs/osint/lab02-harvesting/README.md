# Lab 02 — Subdomain & Email Harvesting

## Objetivo

Enumerar subdominios activos, recolectar emails corporativos y mapear la superficie de ataque de un objetivo usando theHarvester, subfinder y amass.

---

## Parte 1 — theHarvester

theHarvester recolecta emails, subdominios, hosts, nombres e IPs desde múltiples fuentes públicas.

```bash
# Sintaxis básica
theHarvester -d dominio.com -b fuente

# Fuentes disponibles principales
theHarvester -d nmap.org -b google
theHarvester -d nmap.org -b bing
theHarvester -d nmap.org -b duckduckgo
theHarvester -d nmap.org -b crtsh        # Certificate Transparency
theHarvester -d nmap.org -b dnsdumpster
theHarvester -d nmap.org -b hackertarget

# Usar todas las fuentes (más lento)
theHarvester -d nmap.org -b all

# Guardar resultados
theHarvester -d nmap.org -b all -f /workspace/reports/nmap_harvest
# Genera nmap_harvest.xml y nmap_harvest.json

# Limitar resultados por fuente
theHarvester -d nmap.org -b google -l 200

# Con resolución DNS de hosts encontrados
theHarvester -d nmap.org -b crtsh -r
```

### Interpretar la salida

```
[*] Emails found: 3
        admin@nmap.org
        fyodor@nmap.org
        security@nmap.org

[*] Hosts found: 12
        svn.nmap.org:45.33.49.119
        www.nmap.org:45.33.32.156
        mail.nmap.org:209.85.220.41
```

**Emails** → phishing dirigido, credential stuffing, LinkedIn OSINT
**Hosts** → superficie de ataque, servicios expuestos

---

## Parte 2 — Subfinder

Subfinder hace enumeración pasiva de subdominios usando fuentes como CertSpotter, Shodan, VirusTotal y más de 40 fuentes.

```bash
# Básico
subfinder -d nmap.org

# Con salida limpia para pipes
subfinder -d nmap.org -silent

# Múltiples dominios
subfinder -d nmap.org -d scanme.nmap.org

# Desde archivo de dominios
subfinder -dL dominios.txt -silent

# Guardar salida
subfinder -d nmap.org -o subdominios.txt

# Ver fuentes que se están usando
subfinder -d nmap.org -ls

# Con API keys configuradas (más resultados)
subfinder -d nmap.org -all
```

### Configurar API keys para más resultados

```bash
# Archivo de configuración: ~/.config/subfinder/provider-config.yaml
cat ~/.config/subfinder/provider-config.yaml
```

```yaml
# provider-config.yaml — agregar tus keys gratuitas
virustotal:
  - TU_VIRUSTOTAL_API_KEY
shodan:
  - TU_SHODAN_API_KEY
censys:
  - TU_CENSYS_API_ID:TU_CENSYS_API_SECRET
```

---

## Parte 3 — Amass

Amass es la herramienta más completa para enumeración de subdominios. Combina técnicas activas y pasivas.

```bash
# Enumeración pasiva (sin interacción con el objetivo)
amass enum --passive -d nmap.org

# Enumeración activa (DNS bruteforce incluido)
amass enum -active -d nmap.org

# Con wordlist personalizada
amass enum -active -d nmap.org -w /usr/share/wordlists/SecLists/Discovery/DNS/subdomains-top1million-5000.txt

# Ver el grafo de relaciones
amass enum -d nmap.org -json /workspace/reports/amass_nmap.json

# Visualizar relaciones entre dominios, IPs y ASNs
amass viz -d3 -dir /tmp/amass -o /workspace/reports/amass_graph.html
```

---

## Parte 4 — Verificar subdominios activos con httpx

Los subdominios enumerados no todos están activos. httpx verifica cuáles responden HTTP:

```bash
# Combinar subfinder + httpx
subfinder -d nmap.org -silent | httpx -silent

# Con información adicional
subfinder -d nmap.org -silent | httpx -title -status-code -tech-detect -silent

# Guardar solo los que responden
subfinder -d nmap.org -silent | httpx -silent -o vivos.txt

# Salida con tecnologías
subfinder -d nmap.org -silent | httpx -title -status-code -tech-detect -json \
    | python3 -m json.tool | head -50
```

---

## Parte 5 — GitHub OSINT

GitHub puede contener código interno, credenciales y referencias a infraestructura.

```bash
# Buscar en GitHub (manual en el navegador o con API)
# Dorks útiles:

# Credenciales hardcodeadas
org:empresa "api_key" OR "secret" OR "password" OR "token"
org:empresa filename:.env
org:empresa filename:config.yml "password"

# Infraestructura interna
org:empresa "192.168." OR "10.0." OR "172.16."
org:empresa "internal.empresa.com"

# Con GitHub CLI (gh)
gh search code "api_key" --owner empresa --limit 30
gh search code "DB_PASSWORD" --owner empresa
```

### GitLeaks (automatizado)

```bash
# Escanear un repositorio en busca de secretos
gitleaks detect --source /ruta/al/repo --report-format json

# Clonar + escanear
git clone https://github.com/empresa/repo /tmp/repo
gitleaks detect --source /tmp/repo
```

---

## Parte 6 — Consolidar y deduplicar resultados

```bash
# Combinar resultados de múltiples herramientas
cat subdominios_subfinder.txt \
    subdominios_amass.txt \
    subdominios_theharvester.txt \
    | sort -u > subdominios_total.txt

# Ver cuántos encontró cada herramienta
wc -l subdominios_*.txt

# Verificar cuáles responden
cat subdominios_total.txt | httpx -silent -o vivos_final.txt

echo "[+] Subdominios únicos encontrados: $(wc -l < subdominios_total.txt)"
echo "[+] Activos y respondiendo HTTP: $(wc -l < vivos_final.txt)"
```

---

## Actividades

1. Ejecutar theHarvester sobre `nmap.org` con 3 fuentes distintas y comparar resultados
2. Enumerar subdominios de `nmap.org` con subfinder y amass
3. Verificar cuáles subdominios responden HTTP con httpx
4. Buscar en GitHub si existe contenido relacionado con `nmap.org`
5. Consolidar todos los subdominios de los 3 pasos anteriores y obtener el número total único

---

## Referencias

- [theHarvester](https://github.com/laramies/theHarvester)
- [Subfinder](https://github.com/projectdiscovery/subfinder)
- [Amass](https://github.com/owasp-amass/amass)
- [httpx](https://github.com/projectdiscovery/httpx)
- [GitLeaks](https://github.com/gitleaks/gitleaks)
- [SecLists — DNS Wordlists](https://github.com/danielmiessler/SecLists/tree/master/Discovery/DNS)
