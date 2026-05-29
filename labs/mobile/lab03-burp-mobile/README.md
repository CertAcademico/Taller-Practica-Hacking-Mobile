# Lab 03 — Interceptación con Burp Suite en Android Docker

## Objetivo

Interceptar el tráfico HTTP/HTTPS de apps Android usando Burp Suite como proxy, configurando el certificado CA en el emulador dockerizado.

---

## Entorno Docker

```
┌─────────────────────────────────────────────────────┐
│  Android Emulator (Docker)                          │
│  Proxy configurado → 10.0.2.2:8080 (gateway host)  │
│                         │                           │
└─────────────────────────┼───────────────────────────┘
                          │ tráfico HTTP/S
                          ▼
               ┌──────────────────┐
               │  Burp Suite      │  ← corre en tu host
               │  Listen: 0.0.0.0:8080 │
               └──────────────────┘
```

> `10.0.2.2` es la IP del host desde dentro del emulador Android.

---

## Requisitos

- Burp Suite Community/Pro instalado en el host
- Emulador corriendo: `docker compose up -d android`

---

## Parte 1 — Configurar Burp para escuchar en todas las interfaces

En Burp Suite:

1. **Proxy → Proxy Settings → Add** (o editar el listener existente)
2. **Bind to port**: `8080`
3. **Bind to address**: `All interfaces (0.0.0.0)`
4. Habilitar el listener

---

## Parte 2 — Configurar Proxy en el Emulador

### Opción A: vía UI (noVNC)

1. Abre **http://localhost:6080**
2. En Android → **Settings → Wi-Fi**
3. Long press en la red → **Modify network**
4. **Advanced options → Proxy → Manual**
   - Hostname: `10.0.2.2`
   - Port: `8080`

### Opción B: vía ADB

```bash
adb -s localhost:5555 shell settings put global http_proxy 10.0.2.2:8080

# Verificar
adb -s localhost:5555 shell settings get global http_proxy
```

Para eliminar el proxy:
```bash
adb -s localhost:5555 shell settings delete global http_proxy
```

---

## Parte 3 — Instalar Certificado de Burp

Sin el certificado, Burp no puede interceptar HTTPS.

### Exportar certificado desde Burp

```bash
# Opción 1: Desde la UI de Burp
# Proxy → Proxy Settings → Import/Export CA Certificate → Export → DER format
# Guardar como: burp-ca.der

# Opción 2: Descargarlo desde el proxy
curl -s http://10.0.2.2:8080/cert -o /tmp/burp-ca.der
# (ejecutar dentro del emulador o desde el host)
```

### Instalar en el emulador

```bash
# Subir el certificado
adb -s localhost:5555 push /tmp/burp-ca.der /sdcard/burp-ca.cer

# Instalar vía Settings (Android 11)
adb -s localhost:5555 shell am start \
    -n com.android.settings/.Settings \
    -a android.settings.SECURITY_SETTINGS
```

Luego en Android: **Security → Encryption & credentials → Install a certificate → CA certificate**

### Instalar como certificado del sistema (necesita root)

```bash
# Convertir DER a PEM
openssl x509 -inform DER -in /tmp/burp-ca.der -out /tmp/burp-ca.pem

# Obtener el hash del certificado
HASH=$(openssl x509 -inform PEM -subject_hash_old -in /tmp/burp-ca.pem | head -1)

# Copiar al sistema (el emulador de docker-android es rooteado)
adb -s localhost:5555 root
adb -s localhost:5555 remount
adb -s localhost:5555 push /tmp/burp-ca.pem /system/etc/security/cacerts/${HASH}.0
adb -s localhost:5555 shell chmod 644 /system/etc/security/cacerts/${HASH}.0
adb -s localhost:5555 reboot
```

---

## Parte 4 — Interceptar Tráfico de InsecureShop

```bash
# 1. Instalar InsecureShop
adb -s localhost:5555 install vulnerable-apps/InsecureShop/InsecureShop.apk

# 2. Lanzar la app
adb -s localhost:5555 shell am start \
    -n com.shop.insecureshop/com.shop.insecureshop.ui.auth.AuthActivity

# 3. En Burp: Proxy → Intercept → ON
# 4. Intentar login en la app (cualquier credencial)
# 5. Observar la request en Burp
```

Busca en las requests:
- Endpoints de la API
- Credenciales enviadas en claro
- Tokens/cookies sin flags `Secure`/`HttpOnly`
- Parámetros susceptibles a inyección

---

## Parte 5 — mitmproxy como alternativa (sin instalar en host)

```bash
docker exec -it mobile-tools bash

# Iniciar mitmproxy (escucha en 0.0.0.0:8080)
mitmproxy --listen-host 0.0.0.0 --listen-port 8080

# Versión web UI
mitmweb --listen-host 0.0.0.0 --listen-port 8080 --web-host 0.0.0.0 --web-port 8081
```

El certificado de mitmproxy se descarga en: `http://10.0.2.2:8080` desde el emulador.

---

## Actividades

1. Configurar Burp como proxy del emulador Docker
2. Instalar el certificado CA de Burp en el sistema del emulador
3. Interceptar el login de InsecureShop y analizar la request
4. Identificar endpoints de la API con Burp Target → Site Map
5. Intentar modificar la respuesta del servidor (Burp Intercept → Response)

---

## Referencias

- [Burp Suite Mobile Testing](https://portswigger.net/burp/documentation/desktop/mobile)
- [OWASP MASTG — Network Traffic Interception](https://mas.owasp.org/MASTG/techniques/android/MASTG-TECH-0010/)
- [mitmproxy Docs](https://docs.mitmproxy.org/)
