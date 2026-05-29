# Mobile Hacking Labs

Módulo de pentesting de aplicaciones Android usando un entorno completamente dockerizado: emulador Android con noVNC, MobSF para análisis estático y un container de herramientas con jadx, apktool, Frida y Objection.

---

## Arquitectura del Entorno

```
┌─────────────────────────────────────────────────────────────────────┐
│  Host                                                               │
│                                                                     │
│  http://localhost:6080  ──► android        (emulador + noVNC)       │
│  http://localhost:8000  ──► mobsf          (análisis estático)      │
│  adb connect localhost:5555                                         │
│                                                                     │
│  docker exec -it mobile-tools bash   (jadx · apktool · frida)      │
└─────────────────────────────────────────────────────────────────────┘
                  │                │                │
         ┌────────┘        ┌───────┘       ┌────────┘
         ▼                 ▼               ▼
  [mobile-android]    [mobile-mobsf]  [mobile-tools]
  Android 11 x86      MobSF latest    Debian + herramientas
  budtmo/docker-android               jadx · apktool · frida
                                      objection · mitmproxy
```

---

## Inicio Rápido

```bash
# 1. Desde el directorio del módulo
cd labs/mobile

# 2. Levantar todo el entorno
./containers/mobile/scripts/setup.sh

# 3. Ver el emulador Android en el navegador
open http://localhost:6080

# 4. Ver MobSF
open http://localhost:8000

# 5. Instalar APKs vulnerables
./containers/mobile/scripts/install-apks.sh

# 6. Entrar al container de herramientas
docker exec -it mobile-tools bash
```

### Comandos Docker

```bash
# Levantar todo
docker compose -f containers/mobile/docker-compose.yml up -d

# Ver logs del emulador (útil al arrancar)
docker logs -f mobile-android

# Parar todo
docker compose -f containers/mobile/docker-compose.yml down
```

---

## Requisitos

| Requisito | Versión mínima |
|-----------|---------------|
| Docker Desktop | 4.x |
| Docker Compose | v2 |
| RAM disponible | 4 GB para el emulador |
| CPU | Virtualización habilitada en BIOS |

> **Apple Silicon (M1/M2/M3):** El emulador corre en modo x86 emulado vía Rosetta. Funciona pero es más lento. Para mejor rendimiento usa `--platform linux/arm64` si está disponible en tu versión de `budtmo/docker-android`.

---

## Apps Vulnerables

| App | Paquete | APK |
|-----|---------|-----|
| DIVA (Damn Insecure & Vulnerable App) | `jakhar.aseem.diva` | `vulnerable-apps/diva-android/diva-beta.apk` |
| InsecureShop | `com.shop.insecureshop` | `vulnerable-apps/InsecureShop/InsecureShop.apk` |

---

## Labs

| Lab | Tema | Herramientas | Dificultad |
|-----|------|-------------|-----------|
| [Lab 01](lab01-adb-basics/) | ADB Básico con Docker | adb, noVNC | Principiante |
| [Lab 02](lab02-apk-reversing/) | APK Reversing | jadx, apktool, MobSF | Principiante |
| [Lab 03](lab03-burp-mobile/) | Interceptación con Burp | Burp Suite, mitmproxy | Intermedio |
| [Lab 04](lab04-frida-basics/) | Frida & Objection | frida-tools, objection | Intermedio |
| [Lab 05](lab05-api-testing/) | API Testing Mobile | Burp, curl, frida | Intermedio |
| [Lab 06](lab06-ssl-pinning/) | SSL Pinning Bypass | frida, objection, apktool | Avanzado |

---

## Tutorial: Primer Pentest Mobile de Inicio a Fin

Esta guía recorre los 6 labs en secuencia usando **DIVA** e **InsecureShop** como objetivos. Cada paso construye sobre el anterior.

### Paso 0 — Levantar el entorno

```bash
cd labs/mobile
./containers/mobile/scripts/setup.sh
```

Espera a ver el mensaje de servicios disponibles. El emulador tarda ~2 min.  
Abre **http://localhost:6080** para confirmar que Android está corriendo.

---

### Paso 1 — Conectar ADB e instalar apps

```bash
# Conectar ADB desde el host
adb connect localhost:5555

# Verificar
adb devices
# → localhost:5555   device

# Instalar ambas apps vulnerables
adb -s localhost:5555 install vulnerable-apps/diva-android/diva-beta.apk
adb -s localhost:5555 install vulnerable-apps/InsecureShop/InsecureShop.apk

# Confirmar instalación
adb -s localhost:5555 shell pm list packages -3
```

Las apps aparecen en el launcher del emulador (visible en noVNC).

---

### Paso 2 — Análisis Estático con MobSF

Antes de ejecutar nada, analiza el APK estáticamente.

1. Abre **http://localhost:8000**
2. Arrastra `vulnerable-apps/InsecureShop/InsecureShop.apk` a la interfaz
3. Espera el análisis (~1 min)

Busca en el reporte:
- **Permissions** — ¿pide permisos que no necesita?
- **Hardcoded Secrets** — contraseñas o API keys en el código
- **Exported Components** — actividades accesibles sin permiso
- **Security Score** — baseline de seguridad

```bash
# Paralelamente, decompilar con jadx para revisar el código
docker exec -it mobile-tools bash

jadx -d /workspace/shop-decomp /apks/InsecureShop/InsecureShop.apk

# Buscar credenciales hardcodeadas
grep -rn "password\|secret\|api_key" /workspace/shop-decomp/ \
     --include="*.java" -i | head -20

# Buscar endpoints de la API
grep -rEo '"https?://[^"]*"' /workspace/shop-decomp/ | sort -u
```

Anota los endpoints encontrados, los necesitarás en el Paso 4.

---

### Paso 3 — Configurar el Proxy (Burp / mitmproxy)

#### Opción A: mitmproxy (sin instalar nada extra)

```bash
# Desde mobile-tools, levantar mitmproxy
docker exec -it mobile-tools bash
mitmweb --listen-host 0.0.0.0 --listen-port 8080 \
        --web-host 0.0.0.0 --web-port 8081
```

UI de mitmproxy disponible en **http://localhost:8081**

#### Opción B: Burp Suite (en el host)

En Burp: **Proxy → Proxy Settings → Bind to address: All interfaces (0.0.0.0)**

#### Configurar el proxy en el emulador

```bash
adb -s localhost:5555 shell settings put global http_proxy 10.0.2.2:8080
```

#### Instalar certificado CA

```bash
# Descargar cert del proxy
curl -s http://localhost:8080/cert -o /tmp/proxy-ca.pem 2>/dev/null || \
curl -s http://127.0.0.1:8081/cert/pem -o /tmp/proxy-ca.pem

# Subir al emulador
adb -s localhost:5555 push /tmp/proxy-ca.pem /sdcard/proxy-ca.pem

# Instalar como CA del sistema (el emulador es rooteado)
HASH=$(openssl x509 -inform PEM -subject_hash_old -in /tmp/proxy-ca.pem | head -1)
adb -s localhost:5555 root
adb -s localhost:5555 remount
adb -s localhost:5555 push /tmp/proxy-ca.pem /system/etc/security/cacerts/${HASH}.0
adb -s localhost:5555 shell chmod 644 /system/etc/security/cacerts/${HASH}.0
adb -s localhost:5555 reboot
```

Tras el reboot, todo el tráfico HTTPS de InsecureShop pasará por el proxy.

---

### Paso 4 — Interceptar el Login de InsecureShop

Con el proxy activo:

1. Lanza InsecureShop en el emulador (noVNC)
2. Introduce cualquier credencial en el login
3. Observa la request en Burp/mitmproxy

```
POST /api/auth/login HTTP/1.1
Host: <api-host>
Content-Type: application/json

{"email":"test@test.com","password":"test123"}
```

Prueba en **Burp Repeater**:
- Cambiar el email por el de otro usuario
- Modificar el `userId` en la respuesta (IDOR)
- Enviar sin token de autenticación

---

### Paso 5 — Instrumentación con Frida

```bash
# 1. Subir frida-server al emulador
./containers/mobile/scripts/frida-push.sh

# 2. Conectar con objection
docker exec -it mobile-tools bash
objection -N -h mobile-android -p 5555 -g com.shop.insecureshop explore
```

Comandos útiles en objection:

```
# Ver datos guardados en SharedPreferences
android sharedpreferences get

# Ver base de datos SQLite
sqlite connect /data/data/com.shop.insecureshop/databases/insecureshop.db
sqlite execute select * from users

# Deshabilitar SSL pinning (si lo hubiera)
android sslpinning disable

# Ver actividad actual
android hooking get current_activity

# Hookear el método de login
android hooking watch class_method \
    com.shop.insecureshop.ui.auth.LoginActivity.login --dump-args --dump-return
```

---

### Paso 6 — Bypassear SSL Pinning (si aplica)

Si el proxy no intercepta tráfico incluso con el certificado instalado, la app tiene SSL pinning.

```bash
docker exec -it mobile-tools bash

# Script de bypass universal
cat > /workspace/ssl-bypass.js << 'EOF'
Java.perform(function() {
    var TrustManager = Java.registerClass({
        name: "dev.bypass.TM",
        implements: [Java.use("javax.net.ssl.X509TrustManager")],
        methods: {
            checkClientTrusted: function(c, a) {},
            checkServerTrusted: function(c, a) {},
            getAcceptedIssuers: function() { return []; }
        }
    });
    var SSLContext = Java.use("javax.net.ssl.SSLContext");
    SSLContext.init.overload(
        "[Ljavax.net.ssl.KeyManager;",
        "[Ljavax.net.ssl.TrustManager;",
        "java.security.SecureRandom"
    ).implementation = function(km, tm, sr) {
        this.init(km, [TrustManager.$new()], sr);
    };

    try {
        var CP = Java.use("okhttp3.CertificatePinner");
        CP.check.overload("java.lang.String", "java.util.List")
            .implementation = function(h, c) {
                console.log("[bypass] pinning evitado: " + h);
            };
    } catch(e) {}

    console.log("[*] SSL Pinning bypass activo.");
});
EOF

frida -H mobile-android:5555 -f com.shop.insecureshop \
      --no-pause -l /workspace/ssl-bypass.js
```

Con esto, el tráfico HTTPS vuelve a aparecer en el proxy.

---

### Resumen del flujo

```
setup.sh
  └── Emulador + MobSF + mobile-tools levantados
        │
        ├── install-apks.sh      → DIVA e InsecureShop instalados
        │
        ├── MobSF                → reporte estático (permisos, secretos, componentes)
        ├── jadx / apktool       → revisión de código y smali
        │
        ├── Proxy configurado    → interceptación HTTP/HTTPS
        │
        ├── frida-push.sh        → frida-server en el emulador
        ├── objection            → análisis dinámico, SharedPrefs, SQLite
        │
        └── ssl-bypass.js        → SSL pinning evitado si aplica
```

---

## Estructura del Módulo

```
mobile/
├── README.md
├── containers/mobile/
│   ├── docker-compose.yml       ← android · mobsf · mobile-tools
│   ├── Dockerfile               ← jadx · apktool · frida · objection
│   └── scripts/
│       ├── setup.sh             ← levanta todo el entorno
│       ├── install-apks.sh      ← instala APKs en el emulador
│       └── frida-push.sh        ← sube frida-server al emulador
├── vulnerable-apps/
│   ├── diva-android/
│   └── InsecureShop/
├── lab01-adb-basics/
├── lab02-apk-reversing/
├── lab03-burp-mobile/
├── lab04-frida-basics/
├── lab05-api-testing/
└── lab06-ssl-pinning/
```

---

## Referencias

- [OWASP Mobile Application Security Testing Guide (MASTG)](https://mas.owasp.org/MASTG/)
- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [budtmo/docker-android](https://github.com/budtmo/docker-android)
- [MobSF](https://github.com/MobSF/Mobile-Security-Framework-MobSF)
- [Frida](https://frida.re/)
- [Objection](https://github.com/sensepost/objection)
