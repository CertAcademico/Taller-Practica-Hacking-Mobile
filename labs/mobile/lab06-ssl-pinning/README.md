# Lab 06 — SSL Pinning Bypass con Docker

## Objetivo

Entender cómo funciona el certificate pinning en Android, por qué existe, y cómo bypassearlo con Frida/Objection para continuar interceptando tráfico HTTPS.

---

## ¿Qué es SSL Pinning?

Sin pinning: la app confía en cualquier CA del sistema → instalar cert de Burp = intercepción total.

Con pinning: la app valida que el certificado del servidor coincida exactamente con uno hardcodeado en el APK → el cert de Burp es rechazado.

```
Sin pinning:  App → [Burp CA instalada] → Burp → Internet ✓
Con pinning:  App → [Burp CA instalada] → Burp → RECHAZADO ✗ (mismatch con cert pinneado)
```

---

## Requisitos

- Entorno levantado: `docker compose up -d android mobile-tools`
- frida-server corriendo en el emulador (ver Lab 04)
- Burp configurado como proxy (ver Lab 03)

---

## Parte 1 — Detectar si una App Tiene SSL Pinning

### Método 1: Análisis estático con jadx

```bash
docker exec -it mobile-tools bash

jadx -d /workspace/shop-decomp /apks/InsecureShop/InsecureShop.apk

# Buscar implementaciones de pinning
grep -rn "CertificatePinner\|TrustManager\|X509TrustManager\|checkServerTrusted\|getAcceptedIssuers" \
     /workspace/shop-decomp/ --include="*.java"

# OkHttp certificate pinner
grep -rn "CertificatePinner\|Builder.*pin\|sha256/" \
     /workspace/shop-decomp/ --include="*.java"

# Network Security Config (pinning declarativo)
find /workspace/shop-decomp/ -name "network_security_config.xml"
cat /workspace/shop-decomp/res/xml/network_security_config.xml 2>/dev/null
```

### Método 2: Comportamiento en tiempo de ejecución

1. Configura Burp como proxy (Lab 03)
2. Abre la app en el emulador
3. Si aparece `SSLHandshakeException` en logcat → hay pinning

```bash
adb -s localhost:5555 logcat | grep -i "ssl\|certificate\|handshake\|pin" -i
```

---

## Parte 2 — Bypass con Objection (método más rápido)

```bash
docker exec -it mobile-tools bash

# Lanzar objection contra InsecureShop
objection -N -h mobile-android -p 5555 -g com.shop.insecureshop explore

# Una vez dentro:
android sslpinning disable

# Salida esperada:
# (agent) Custom TrustManager registered, targeting 0 SystemCA stores
# (agent) SSLContext patched!
```

Ahora el tráfico debe fluir por Burp sin errores.

---

## Parte 3 — Bypass con Script Frida Universal

### Script universal anti-pinning

Crea `/workspace/ssl-bypass.js`:

```javascript
// Universal SSL Pinning Bypass
// Compatible con: OkHttp3, TrustManager personalizado, Conscrypt, TrustKit

setTimeout(function() {
    Java.perform(function() {

        // ── TrustManager personalizado ──────────────────────────────────
        var TrustManager = Java.registerClass({
            name: "dev.tmpfs.bypass.TrustManager",
            implements: [Java.use("javax.net.ssl.X509TrustManager")],
            methods: {
                checkClientTrusted: function(chain, authType) {},
                checkServerTrusted: function(chain, authType) {},
                getAcceptedIssuers: function() { return []; }
            }
        });

        var SSLContext = Java.use("javax.net.ssl.SSLContext");
        var TrustManagers = [TrustManager.$new()];
        var SSLContextInit = SSLContext.init.overload(
            "[Ljavax.net.ssl.KeyManager;",
            "[Ljavax.net.ssl.TrustManager;",
            "java.security.SecureRandom"
        );
        SSLContextInit.implementation = function(km, tm, sr) {
            console.log("[SSL] SSLContext.init() hookeado");
            SSLContextInit.call(this, km, TrustManagers, sr);
        };

        // ── OkHttp3 CertificatePinner ───────────────────────────────────
        try {
            var CertificatePinner = Java.use("okhttp3.CertificatePinner");
            CertificatePinner.check.overload("java.lang.String", "java.util.List")
                .implementation = function(hostname, certs) {
                    console.log("[OkHttp] CertificatePinner.check bypassed: " + hostname);
                };
            CertificatePinner.check.overload("java.lang.String", "[Ljava.security.cert.Certificate;")
                .implementation = function(hostname, certs) {
                    console.log("[OkHttp] CertificatePinner.check(cert[]) bypassed: " + hostname);
                };
        } catch(e) {
            console.log("[*] OkHttp CertificatePinner no encontrado");
        }

        // ── HostnameVerifier ────────────────────────────────────────────
        try {
            var HostnameVerifier = Java.use("javax.net.ssl.HttpsURLConnection");
            HostnameVerifier.setDefaultHostnameVerifier.implementation = function(v) {
                console.log("[SSL] HostnameVerifier bypass");
                var AlwaysTrue = Java.registerClass({
                    name: "dev.tmpfs.AlwaysTrue",
                    implements: [Java.use("javax.net.ssl.HostnameVerifier")],
                    methods: {
                        verify: function(host, session) { return true; }
                    }
                });
                this.setDefaultHostnameVerifier(AlwaysTrue.$new());
            };
        } catch(e) {}

        console.log("[*] SSL Pinning bypass cargado.");
    });
}, 0);
```

```bash
# Ejecutar contra InsecureShop
frida -H mobile-android:5555 -f com.shop.insecureshop \
      --no-pause -l /workspace/ssl-bypass.js
```

---

## Parte 4 — Bypass con Network Security Config (APK Patching)

Para apps sin root real, modificar el APK:

```bash
docker exec -it mobile-tools bash

# Descompilar
apktool d /apks/InsecureShop/InsecureShop.apk -o /workspace/shop-patched

# Crear network_security_config.xml sin restricciones
cat > /workspace/shop-patched/res/xml/network_security_config.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </base-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="user"/>
        </trust-anchors>
    </debug-overrides>
</network-security-config>
EOF

# Asegurarse de que el manifest apunte a la config
# Buscar android:networkSecurityConfig en el manifest y agregar si no existe
grep -n "networkSecurityConfig" /workspace/shop-patched/AndroidManifest.xml

# Reempaquetar
apktool b /workspace/shop-patched -o /workspace/insecureshop-patched.apk

# Firmar el APK (necesario para instalar)
keytool -genkey -v -keystore /workspace/debug.keystore \
        -alias debug -keyalg RSA -keysize 2048 \
        -validity 10000 -noprompt \
        -dname "CN=Debug, O=Debug, C=US" \
        -storepass debugkey -keypass debugkey

jarsigner -keystore /workspace/debug.keystore \
          -storepass debugkey -keypass debugkey \
          /workspace/insecureshop-patched.apk debug

# Instalar APK parchado
adb -s localhost:5555 install -r /workspace/insecureshop-patched.apk
```

---

## Parte 5 — Verificar el Bypass

```bash
# Con el proxy activo y frida/objection corriendo:
# 1. Abrir InsecureShop en el emulador
# 2. Hacer login
# 3. Verificar en Burp que las requests HTTPS aparecen interceptadas

# Si ves requests en Burp → bypass exitoso ✓
# Si sigue fallando → la app puede tener múltiples capas de pinning
```

Troubleshooting:
```bash
# Ver exactamente dónde falla
adb -s localhost:5555 logcat | grep -E "SSL|TRUST|CERT|pinning" -i

# Forzar frida a hookear más clases
# Añadir al script: Java.enumerateLoadedClasses para encontrar
# implementaciones personalizadas de TrustManager
```

---

## Actividades

1. Detectar si InsecureShop implementa certificate pinning (estático + dinámico)
2. Bypassear el pinning con objection `android sslpinning disable`
3. Aplicar el script Frida universal y capturar el tráfico HTTPS en Burp
4. Modificar el `network_security_config.xml` del APK y reinstalar
5. Documentar qué método de pinning usaba la app y qué bypass funcionó

---

## Referencias

- [Frida SSL Pinning Bypass](https://frida.re/docs/examples/android/)
- [Objection Android SSL](https://github.com/sensepost/objection/wiki/Android-SSL-Pinning)
- [Android Network Security Config](https://developer.android.com/privacy-and-security/security-config)
- [OWASP MASTG — Testing SSL Pinning](https://mas.owasp.org/MASTG/techniques/android/MASTG-TECH-0012/)
