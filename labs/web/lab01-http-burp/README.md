# Lab 01 — HTTP & Burp Suite

## Objetivo

Entender el protocolo HTTP a nivel de petición/respuesta e interceptar, analizar y modificar tráfico web con Burp Suite Community.

---

## Entorno

```
Burp Suite (proxy en 127.0.0.1:8080)
        │
        ▼
DVWA  →  http://localhost:8080
```

Configura el proxy en tu navegador: `127.0.0.1:8080` (o usa FoxyProxy).

---

## Parte 1 — Anatomía de HTTP

### Petición HTTP

```
GET /login.php HTTP/1.1
Host: localhost:8080
User-Agent: Mozilla/5.0
Accept: text/html
Cookie: PHPSESSID=abc123; security=low
Connection: keep-alive
```

| Componente | Descripción |
|-----------|-------------|
| Método | GET, POST, PUT, DELETE, PATCH, OPTIONS |
| Path | Ruta del recurso (`/login.php`) |
| Headers | Metadatos: Host, Cookie, Content-Type |
| Body | Solo en POST/PUT — datos del formulario o JSON |

### Respuesta HTTP

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Set-Cookie: PHPSESSID=xyz789; path=/; HttpOnly

<html>...</html>
```

### Códigos de estado importantes en pentesting

| Código | Significado | Relevancia |
|--------|-------------|-----------|
| 200 | OK | Recurso existe y es accesible |
| 301/302 | Redirect | Puede revelar rutas internas |
| 401 | Unauthorized | Requiere autenticación |
| 403 | Forbidden | Existe pero está bloqueado |
| 404 | Not Found | No existe |
| 500 | Server Error | Posible error de aplicación |

---

## Parte 2 — Burp Suite — Configuración inicial

### 1. Abrir Burp Suite → Proxy → Proxy Settings

```
Bind address: 127.0.0.1
Bind port:    8080
```

### 2. Configurar el navegador

```
Firefox: Ajustes → Red → Proxy manual
  HTTP Proxy: 127.0.0.1   Puerto: 8080
  ✓ Usar para HTTPS también
```

O instalar la extensión **FoxyProxy** para cambiar rápidamente.

### 3. Instalar el certificado CA de Burp

```
1. Con proxy activo, abrir: http://burpsuite
2. Descargar "CA Certificate"
3. Firefox: Ajustes → Privacidad → Certificados → Importar
   ✓ Confiar para identificar sitios web
```

---

## Parte 3 — Interceptar y modificar peticiones

### Intercept ON

1. En Burp: **Proxy → Intercept → Intercept is on**
2. En el navegador, ir a `http://localhost:8080/login.php`
3. Burp captura la petición antes de enviarla

### Modificar la petición

```
POST /login.php HTTP/1.1
Host: localhost:8080
Content-Type: application/x-www-form-urlencoded

username=admin&password=MODIFICA_ESTO&Login=Login
```

Cambia el valor de `password` → **Forward** → observa la respuesta.

### Burp Repeater

1. Click derecho sobre una petición → **Send to Repeater**
2. En Repeater: modifica y reenvía sin límite
3. Compara respuestas lado a lado

```
# Probar diferentes valores de username:
admin
administrator
' OR 1=1--
test@test.com
```

---

## Parte 4 — Burp Scanner (pasivo)

Burp Community escanea pasivamente mientras navegas:

1. **Target → Site Map** — ver todos los recursos descubiertos
2. **Target → Scope** — definir el scope (solo DVWA)
3. **Dashboard → Issues** — hallazgos automáticos

```
Scope: http://localhost:8080
✓ Include subdirectories
```

---

## Parte 5 — Herramientas de reconocimiento web

```bash
# Descubrir directorios y archivos
gobuster dir -u http://localhost:8080 \
    -w /usr/share/wordlists/dirb/common.txt \
    -x php,txt,bak

# Nikto — scanner de vulnerabilidades básico
nikto -h http://localhost:8080

# Identificar tecnologías
whatweb http://localhost:8080
curl -I http://localhost:8080    # cabeceras HTTP
```

### Cabeceras de seguridad a verificar

```bash
curl -sI http://localhost:8080 | grep -iE \
    "x-frame-options|content-security-policy|x-xss-protection|strict-transport|x-content-type"
```

| Header | Función | Ausencia = riesgo |
|--------|---------|------------------|
| `X-Frame-Options` | Previene clickjacking | Clickjacking |
| `Content-Security-Policy` | Restringe recursos | XSS |
| `Strict-Transport-Security` | Fuerza HTTPS | Downgrade |
| `X-Content-Type-Options` | Evita MIME sniffing | Drive-by download |

---

## Actividades

1. Interceptar el login de DVWA y capturar las credenciales en Burp
2. Usar Repeater para probar 5 combinaciones de usuario/contraseña
3. Descubrir al menos 10 rutas de DVWA con gobuster
4. Identificar qué cabeceras de seguridad faltan en DVWA
5. Mapear toda la aplicación en Burp Target → Site Map

---

## Referencias

- [PortSwigger — Burp Suite Getting Started](https://portswigger.net/burp/documentation/desktop/getting-started)
- [HTTP — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [OWASP Testing Guide — Information Gathering](https://owasp.org/www-project-web-security-testing-guide/)
