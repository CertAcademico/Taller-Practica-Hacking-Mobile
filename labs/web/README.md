# Web Exploitation Labs

Módulo de pentesting de aplicaciones web usando entornos dockerizados: DVWA, OWASP Juice Shop y WebGoat. Cubre las vulnerabilidades más críticas del OWASP Top 10 con ejercicios prácticos.

---

## Arquitectura del Entorno

```
┌─────────────────────────────────────────────────────────────────┐
│  Host                                                           │
│                                                                 │
│  http://localhost:8080  ──► DVWA        (PHP/MySQL clásico)     │
│  http://localhost:3000  ──► Juice Shop  (Node.js moderno)       │
│  http://localhost:8888  ──► WebGoat     (Java/Spring)           │
│                                                                 │
│  Burp Suite / OWASP ZAP  →  proxy en 127.0.0.1:8080            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Inicio Rápido

```bash
cd labs/web
./containers/setup.sh

# Verificar servicios
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080   # DVWA
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000   # Juice Shop
```

### Setup inicial DVWA

1. Abrir **http://localhost:8080/setup.php**
2. Click **Create / Reset Database**
3. Login: `admin` / `password`
4. **DVWA Security → Low** (para empezar)

---

## Requisitos

| Requisito | Versión mínima |
|-----------|---------------|
| Docker Desktop | 4.x |
| Docker Compose | v2 |
| Burp Suite Community | 2024.x |
| RAM disponible | 2 GB |

---

## Labs

| Lab | Vulnerabilidad | App objetivo | OWASP | Dificultad |
|-----|---------------|-------------|-------|-----------|
| [Lab 01](lab01-http-burp/) | HTTP & Burp Suite | DVWA | — | Principiante |
| [Lab 02](lab02-sqli/) | SQL Injection | DVWA | A03:2021 | Principiante |
| [Lab 03](lab03-xss/) | Cross-Site Scripting | DVWA + Juice Shop | A03:2021 | Principiante |
| [Lab 04](lab04-idor/) | IDOR & Broken Access Control | Juice Shop | A01:2021 | Intermedio |
| [Lab 05](lab05-file-upload/) | File Upload | DVWA | A04:2021 | Intermedio |
| [Lab 06](lab06-ssrf-cmdi/) | SSRF & Command Injection | DVWA + WebGoat | A10:2021 | Avanzado |

---

## Apagar el entorno

```bash
docker compose -f containers/docker-compose.yml down
docker compose -f containers/docker-compose.yml down -v   # eliminar volúmenes
```

---

## Referencias

- [OWASP Top 10 — 2021](https://owasp.org/Top10/)
- [DVWA — Damn Vulnerable Web Application](https://github.com/digininja/DVWA)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
- [WebGoat](https://owasp.org/www-project-webgoat/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
