# Lab — Redes

Reconocimiento y enumeración de redes desde perspectiva ofensiva: scanning de puertos, detección de servicios, análisis de tráfico y mapeo de infraestructura.

---

## Objetivos

- Realizar discovery de hosts en una red
- Enumerar puertos y servicios con Nmap
- Identificar versiones de software y posibles vulnerabilidades
- Capturar y analizar tráfico de red
- Usar herramientas de scanning automatizado

---

## Parte 1 — Nmap

Nmap es el estándar para reconocimiento de redes. Permite descubrir hosts, puertos, servicios y sistemas operativos.

### Scans básicos

```bash
# Ping sweep — descubrir hosts activos
nmap -sn 192.168.1.0/24

# Scan de puertos comunes (top 1000)
nmap 192.168.1.10

# Scan completo — todos los puertos
nmap -p- 192.168.1.10

# Detección de servicios y versiones
nmap -sV 192.168.1.10

# Detección de SO
nmap -O 192.168.1.10

# Scan agresivo (OS + versiones + scripts + traceroute)
nmap -A 192.168.1.10

# Guardar resultado
nmap -A 192.168.1.10 -oN resultado.txt
nmap -A 192.168.1.10 -oX resultado.xml
```

### Scripts NSE (Nmap Scripting Engine)

```bash
# Ver scripts disponibles
ls /usr/share/nmap/scripts/ | grep smb

# Usar categoría de scripts
nmap --script=vuln 192.168.1.10
nmap --script=auth 192.168.1.10
nmap --script=discovery 192.168.1.10

# Scripts específicos
nmap --script=smb-vuln-ms17-010 192.168.1.10    # EternalBlue
nmap --script=http-title 192.168.1.10-p 80,443
nmap --script=ssh-auth-methods 192.168.1.10 -p 22

# Banner grabbing
nmap -sV --script=banner 192.168.1.10
```

### Técnicas de evasión

```bash
# Timing (T0=paranoico, T5=insano)
nmap -T2 192.168.1.10    # silencioso
nmap -T4 192.168.1.10    # rápido (lab)

# Fragmentación de paquetes
nmap -f 192.168.1.10

# Scan con decoys (señuelos)
nmap -D RND:5 192.168.1.10

# Scan sin ping (cuando ICMP está bloqueado)
nmap -Pn 192.168.1.10
```

---

## Parte 2 — RustScan

RustScan encuentra puertos abiertos en segundos y los pasa a Nmap automáticamente.

```bash
# Instalación via Docker (sin instalar nada local)
docker run -it --rm --name rustscan rustscan/rustscan:latest -a 192.168.1.10

# Pasar puertos encontrados a Nmap
docker run -it --rm rustscan/rustscan:latest -a 192.168.1.10 -- -sV -sC

# Scan de subred completa
docker run -it --rm rustscan/rustscan:latest -a 192.168.1.0/24 --range 1-65535
```

---

## Parte 3 — Enumeración de servicios comunes

### HTTP / HTTPS (80, 443, 8080)

```bash
# Identificar tecnologías web
whatweb http://192.168.1.10
curl -I http://192.168.1.10      # cabeceras HTTP

# Directory busting
gobuster dir -u http://192.168.1.10 -w /usr/share/wordlists/dirb/common.txt
feroxbuster -u http://192.168.1.10

# Nuclei — scanner de vulnerabilidades web
nuclei -u http://192.168.1.10
nuclei -u http://192.168.1.10 -t http/exposures/
```

### SMB (445)

```bash
nmap --script=smb-enum-shares,smb-enum-users 192.168.1.10 -p 445
smbclient -L //192.168.1.10 -N
smbclient //192.168.1.10/share -N
```

### FTP (21)

```bash
nmap --script=ftp-anon 192.168.1.10 -p 21
ftp 192.168.1.10        # intentar acceso anónimo: anonymous / ""
```

### SSH (22)

```bash
nmap --script=ssh-auth-methods 192.168.1.10 -p 22
ssh -v usuario@192.168.1.10    # ver métodos de autenticación
```

---

## Parte 4 — Subdomain Enumeration

```bash
# Subfinder — enumeración pasiva + activa
subfinder -d ejemplo.com
subfinder -d ejemplo.com -o subdominios.txt

# Verificar cuáles responden HTTP
cat subdominios.txt | httpx -silent
cat subdominios.txt | httpx -title -status-code -tech-detect

# Fuerza bruta de subdominios
gobuster dns -d ejemplo.com -w /usr/share/wordlists/SecLists/Discovery/DNS/subdomains-top1million-5000.txt
```

---

## Parte 5 — Análisis de tráfico

### tcpdump

```bash
# Capturar todo el tráfico en eth0
tcpdump -i eth0

# Solo tráfico HTTP
tcpdump -i eth0 port 80 -A

# Capturar y guardar en archivo .pcap
tcpdump -i eth0 -w captura.pcap

# Leer archivo .pcap
tcpdump -r captura.pcap
```

### Wireshark (filtros útiles)

```
http                          # solo tráfico HTTP
http.request.method == "POST" # peticiones POST
tcp.port == 22                # tráfico SSH
ip.addr == 192.168.1.10       # filtrar por IP
dns                           # solo consultas DNS
```

---

## Parte 6 — Mapeo con Sniffnet

Sniffnet provee visibilidad en tiempo real sobre las conexiones activas del sistema.

```bash
# macOS
brew install sniffnet

# Linux
cargo install sniffnet

# Ejecutar
sniffnet
```

Útil para detectar conexiones inesperadas, monitorear C2 en un lab, o validar qué servicios están activos.

---

## Actividades

1. Realizar un ping sweep en `192.168.1.0/24` e identificar hosts activos
2. Escanear todos los puertos del host objetivo y listar servicios con versión
3. Usar un script NSE para enumerar shares SMB
4. Con RustScan, encontrar puertos abiertos de un objetivo en menos de 10 segundos
5. Capturar tráfico HTTP con tcpdump y extraer credenciales en texto plano

---

## Mapeo MITRE ATT&CK

| Técnica | Herramienta | TTP |
|---------|------------|-----|
| Network Service Discovery | nmap, rustscan | T1046 |
| Active Scanning | nmap -A, nuclei | T1595 |
| Subdomain Enumeration | subfinder, gobuster | T1590.001 |
| Network Traffic Capture | tcpdump, wireshark | T1040 |
| OS Fingerprinting | nmap -O | T1592.001 |

---

## Referencias

- [Nmap Book (gratuito)](https://nmap.org/book/)
- [RustScan GitHub](https://github.com/bee-san/RustScan)
- [Subfinder — ProjectDiscovery](https://github.com/projectdiscovery/subfinder)
- [Nuclei Templates](https://github.com/projectdiscovery/nuclei-templates)
- [TryHackMe — Network Services](https://tryhackme.com/room/networkservices)
