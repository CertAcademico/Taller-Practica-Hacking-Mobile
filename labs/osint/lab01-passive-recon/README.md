# Lab 01 — Reconocimiento Pasivo

## Objetivo

Recolectar información sobre un objetivo usando solo fuentes públicas, sin interactuar directamente con los sistemas del objetivo: DNS, WHOIS, registros históricos y Google Dorks.

**Objetivo de práctica:** `scanme.nmap.org` (autorizado para pruebas)

---

## Parte 1 — WHOIS

WHOIS revela el propietario del dominio, contactos, fechas de registro y nameservers.

```bash
# Información del dominio
whois scanme.nmap.org
whois nmap.org

# Información de una IP
whois 45.33.32.156

# Extraer solo campos clave
whois nmap.org | grep -iE "registrant|admin|tech|email|phone|created|expires|nameserver"
```

### Información útil en WHOIS

| Campo | Utilidad ofensiva |
|-------|------------------|
| Registrant Email | Spear phishing, credential stuffing |
| Admin Phone | Vishing, MFA bypass social engineering |
| Name Servers | Detectar DNS personalizado vs Cloudflare |
| Created/Expires | App antigua = menos mantenimiento |
| Registrar | Detectar si es objetivo de domain hijacking |

---

## Parte 2 — DNS Enumeration

```bash
# Registros básicos
dig nmap.org A         # dirección IPv4
dig nmap.org AAAA      # dirección IPv6
dig nmap.org MX        # servidores de correo
dig nmap.org NS        # nameservers
dig nmap.org TXT       # SPF, DKIM, verificaciones de dominio
dig nmap.org SOA       # Start of Authority
dig nmap.org CNAME     # alias

# Todos los registros
dig nmap.org ANY

# Consultar un servidor DNS específico
dig @8.8.8.8 nmap.org A
dig @1.1.1.1 nmap.org MX

# Resolución inversa (IP → dominio)
dig -x 45.33.32.156

# Herramienta alternativa
nslookup nmap.org
host -a nmap.org
```

### Registros TXT — información sensible

```bash
# SPF revela infraestructura de email
dig nmap.org TXT | grep spf
# v=spf1 include:_spf.google.com ~all
# → usa Google Workspace para el correo

# DMARC — política anti-spoofing
dig _dmarc.nmap.org TXT

# Tokens de verificación (Google, Microsoft, etc.)
dig nmap.org TXT | grep -iE "google|microsoft|verify|site-verification"
```

### Zone Transfer (AXFR)

Si está mal configurado, devuelve TODOS los registros del dominio:

```bash
# Intentar transferencia de zona
dig AXFR nmap.org @ns1.nmap.org

# Con host
host -t AXFR nmap.org ns1.nmap.org

# Herramienta específica
fierce --domain nmap.org
```

> En la mayoría de casos fallará (correctamente configurado). Cuando funciona, expone toda la infraestructura interna.

---

## Parte 3 — Google Dorks

Google indexa información que los administradores no saben que es pública.

### Operadores básicos

| Operador | Ejemplo | Función |
|---------|---------|---------|
| `site:` | `site:empresa.com` | Solo resultados del dominio |
| `filetype:` | `filetype:pdf` | Tipo de archivo |
| `inurl:` | `inurl:admin` | Texto en la URL |
| `intitle:` | `intitle:"index of"` | Texto en el título |
| `intext:` | `intext:"contraseña"` | Texto en el cuerpo |
| `cache:` | `cache:empresa.com` | Versión cacheada |
| `-` | `site:empresa.com -www` | Excluir resultados |

### Dorks de alto impacto

```
# Paneles de administración expuestos
site:empresa.com inurl:admin
site:empresa.com inurl:login
site:empresa.com intitle:"dashboard"

# Archivos sensibles indexados
site:empresa.com filetype:pdf "confidencial"
site:empresa.com filetype:xls "password"
site:empresa.com filetype:env
site:empresa.com filetype:sql

# Subdominios (alternativa a bruteforce)
site:*.empresa.com -www

# Directorios abiertos
site:empresa.com intitle:"index of /"
site:empresa.com intitle:"index of" "parent directory"

# Cámaras y dispositivos expuestos
intitle:"webcamXP 5" inurl:"/web/"
intitle:"Live View / - AXIS"

# Credenciales en código (GitHub dorks)
# → ver lab02 para GitHub Search
```

### Google Hacking Database (GHDB)

```
https://www.exploit-db.com/google-hacking-database
```

Contiene miles de dorks organizados por categoría.

---

## Parte 4 — Registros históricos

### Wayback Machine

```bash
# Ver versiones históricas de una web
curl "https://archive.org/wayback/available?url=nmap.org" | python3 -m json.tool

# URLs históricas (pueden revelar rutas eliminadas)
curl "http://web.archive.org/cdx/search/cdx?url=nmap.org/*&output=text&fl=original&collapse=urlkey" | head -30
```

### BuiltWith / Wappalyzer (tecnologías)

```bash
# Detectar stack tecnológico
whatweb https://nmap.org
curl -sI https://nmap.org | grep -i "server\|x-powered-by\|x-generator"
```

### Certificados TLS — subdominios expuestos

```bash
# crt.sh indexa todos los certificados SSL emitidos para un dominio
curl -s "https://crt.sh/?q=%.nmap.org&output=json" \
    | python3 -c "
import sys,json
data=json.load(sys.stdin)
names={e['name_value'] for e in data}
[print(n) for n in sorted(names)]
" 2>/dev/null | head -30
```

---

## Parte 5 — ASN y rangos de IP

```bash
# Buscar ASN de una empresa (para encontrar todos sus bloques IP)
# Ejemplo: banco colombiano

# Via bgp.he.net (manual)
# https://bgp.he.net/search?search%5Bsearch%5D=bancolombia

# Via whois
whois -h whois.radb.net -- '-i origin AS3816' | grep "^route:"

# Con herramienta bgpq4 (si está instalada)
bgpq4 -j AS3816 | python3 -m json.tool
```

---

## Actividades

1. Obtener toda la información WHOIS de `scanme.nmap.org` y extraer el email del registrante
2. Listar todos los registros DNS (A, MX, NS, TXT) de `nmap.org`
3. Intentar una transferencia de zona AXFR (documentar el resultado)
4. Usar Google Dorks para encontrar 3 subdominios de `nmap.org` no obvios
5. Buscar en `crt.sh` todos los subdominios de `nmap.org` con certificados emitidos

---

## Referencias

- [DNSDumpster](https://dnsdumpster.com/) — DNS recon visual
- [crt.sh](https://crt.sh/) — Certificate Transparency
- [ViewDNS.info](https://viewdns.info/) — múltiples búsquedas DNS
- [Google GHDB](https://www.exploit-db.com/google-hacking-database)
- [Wayback Machine CDX API](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server)
