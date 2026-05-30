# Lab 03 — Shodan & Attack Surface Mapping

## Objetivo

Usar Shodan para identificar dispositivos y servicios expuestos en internet, mapear la superficie de ataque de un objetivo y detectar tecnologías vulnerables sin interactuar con los sistemas.

---

## ¿Qué es Shodan?

Shodan es un motor de búsqueda de dispositivos conectados a internet. Indexa banners de servicios (HTTP, SSH, FTP, Telnet, etc.) revelando versiones de software, configuraciones y vulnerabilidades.

A diferencia de Google que indexa contenido web, Shodan indexa **servicios de red**.

---

## Parte 1 — Shodan Web (sin API key)

Visita [shodan.io](https://shodan.io) y prueba estas búsquedas:

### Filtros básicos

```
# Buscar por organización
org:"Bancolombia"
org:"Google LLC"

# Buscar por país
country:CO                    # Colombia
country:CO port:3389          # RDP expuesto en Colombia

# Buscar por ciudad
city:Bogotá port:22

# Buscar por ASN
asn:AS3816

# Buscar por producto/tecnología
product:"Apache httpd"
product:"nginx" country:CO

# Buscar por versión vulnerable
apache 2.4.49                 # CVE-2021-41773 (path traversal)
product:"OpenSSH" version:"7.2"

# Buscar por puerto específico
port:8080 country:CO
port:5900 country:CO          # VNC expuesto

# Buscar por texto en el banner
"default password"
"admin:admin"
"MongoDB Server Information"  # MongoDB sin auth
```

### Búsquedas de alto impacto

```
# Paneles de cámaras IP
product:"Hikvision" country:CO
title:"webcamXP"
title:"DVR Login" country:CO

# Dispositivos industriales (ICS/SCADA)
product:"Siemens S7"
port:102 country:CO            # Siemens S7 PLC

# Bases de datos expuestas
product:"MongoDB" port:27017
product:"Elasticsearch" port:9200
product:"Redis" port:6379

# Paneles de administración
http.title:"Cisco" port:80
http.title:"pfSense"
http.title:"Jenkins" country:CO

# Certificados TLS — encontrar subdominios
ssl.cert.subject.cn:"*.empresa.com"
ssl:"empresa.com"
```

---

## Parte 2 — Shodan CLI

```bash
# Instalar
pip3 install shodan

# Inicializar con API key (gratuita en shodan.io/dashboard)
shodan init TU_API_KEY

# Información de tu API
shodan info

# Buscar
shodan search "apache 2.4.49"
shodan search --fields ip_str,port,org "MongoDB" --limit 10

# Información de una IP específica
shodan host 45.33.32.156

# Descargar resultados
shodan download resultados "org:Bancolombia"
shodan parse --fields ip_str,port,org resultados.json.gz

# Alertas — monitorear cambios en tu infraestructura
shodan alert create "Mi empresa" 192.168.0.0/24
shodan alert list
```

---

## Parte 3 — Identificar tecnologías vulnerables

```bash
# Paso 1: buscar la versión exacta del software en Shodan
shodan search "Apache 2.4.49" --fields ip_str,port,org --limit 20

# Paso 2: buscar CVEs para esa versión
# https://nvd.nist.gov/vuln/search
# https://cve.mitre.org/

# Paso 3: verificar si hay exploit público
searchsploit "Apache 2.4.49"

# Paso 4: combinar con nuclei para verificar
echo "IP_DEL_OBJETIVO" | nuclei -t http/cves/2021/ -severity critical,high
```

### CVEs comunes detectables con Shodan

| Producto | Versión | CVE | Tipo |
|---------|---------|-----|------|
| Apache | 2.4.49 | CVE-2021-41773 | Path Traversal + RCE |
| Log4j | 2.0-2.14 | CVE-2021-44228 | RCE (Log4Shell) |
| Exchange | 2013-2019 | CVE-2021-26855 | SSRF (ProxyLogon) |
| OpenSSH | < 8.5 | CVE-2023-38408 | RCE |
| Confluence | < 7.18.1 | CVE-2022-26134 | RCE |

---

## Parte 4 — Mapeo de infraestructura corporativa

```bash
# Paso 1: Encontrar el ASN de la empresa
# En shodan.io buscar: org:"Nombre Empresa"
# El ASN aparece en los resultados (ej: AS12345)

# Paso 2: Obtener todos los rangos IP del ASN
whois -h whois.radb.net -- '-i origin AS12345' | grep "^route:"

# Paso 3: Buscar todos los servicios del ASN en Shodan
shodan search "asn:AS12345" --fields ip_str,port,product,version --limit 100

# Paso 4: Identificar servicios críticos expuestos
shodan search "asn:AS12345 port:3389"    # RDP
shodan search "asn:AS12345 port:22"     # SSH
shodan search "asn:AS12345 port:445"    # SMB
shodan search "asn:AS12345 port:1433"   # SQL Server
shodan search "asn:AS12345 port:3306"   # MySQL
```

---

## Parte 5 — Censys (alternativa a Shodan)

```bash
# Censys tiene un motor de búsqueda similar con mejor cobertura de TLS
# https://search.censys.io

# Búsquedas útiles en Censys:
# Todos los IPs de una organización:
autonomous_system.organization: "Bancolombia"

# Certificados para un dominio:
parsed.names: empresa.com

# Servicios SSH:
services.port: 22 AND services.ssh.server_host_key.fingerprint_sha256: "hash"
```

---

## Actividades

1. Buscar en Shodan todos los servicios de `org:"nmap"` y documentar los resultados
2. Encontrar al menos 3 cámaras IP expuestas en Colombia en Shodan (solo documentar, NO acceder)
3. Identificar bases de datos MongoDB o Elasticsearch sin autenticación en un rango de IPs de lab
4. Usar `shodan host` para analizar la IP de `scanme.nmap.org` (45.33.32.156)
5. Buscar el ASN de una empresa colombiana y mapear su infraestructura expuesta

---

## Nota ética

Shodan proporciona información ya pública. **Acceder** a un sistema sin autorización (incluso si aparece en Shodan) es ilegal. El objetivo de este lab es reconocimiento, no acceso.

---

## Referencias

- [Shodan](https://shodan.io)
- [Shodan CLI Docs](https://cli.shodan.io/)
- [Censys](https://search.censys.io)
- [Shodan Dorks — GitHub](https://github.com/jakejarvis/awesome-shodan-queries)
- [FOFA (alternativa china)](https://fofa.info)
