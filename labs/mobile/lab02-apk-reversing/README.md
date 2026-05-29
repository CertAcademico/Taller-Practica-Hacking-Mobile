# Lab 02 — APK Reversing con Docker

## Objetivo

Realizar análisis estático de APKs vulnerables usando **MobSF** (análisis automático), **jadx** (decompilación Java) y **apktool** (smali/recursos), todo sin instalar dependencias en el host.

---

## Entorno Docker

```
┌──────────────────────────────────┐
│  mobile-tools container          │
│  - jadx     → decompila .apk     │
│  - apktool  → smali + recursos   │
│                                  │
│  mobsf container                 │
│  - Web UI  →  localhost:8000     │
│  - Análisis automático completo  │
└──────────────────────────────────┘
```

```bash
cd containers/mobile
docker compose up -d mobsf mobile-tools
```

---

## Parte 1 — MobSF: Análisis Automático

### Acceder a la interfaz

Abre **http://localhost:8000**

> Credenciales por defecto: no requiere login en modo local

### Subir APK

```bash
# Los APKs están montados en /uploads dentro del container
# Desde la UI: arrastra el archivo o usa Upload

# O vía API:
curl -F "file=@vulnerable-apps/diva-android/diva-beta.apk" \
     http://localhost:8000/api/v1/upload \
     -H "Authorization: $(curl -s http://localhost:8000/api/v1/api_docs | grep -o 'REST_KEY:[^"]*' | head -1)"
```

### Qué observar en el reporte

- **Permissions**: permisos declarados en AndroidManifest.xml
- **Security Analysis**: vulnerabilidades detectadas automáticamente
- **Activities / Services / Receivers**: componentes exportados
- **Hardcoded Secrets**: strings sensibles en el código
- **Binary Analysis**: protecciones del binario (stack canary, PIE, etc.)

---

## Parte 2 — jadx: Decompilación Java

```bash
# Entrar al container de herramientas
docker exec -it mobile-tools bash

# Decompilar DIVA a código Java
jadx -d /workspace/diva-decompiled /apks/diva-android/diva-beta.apk

# Decompilar InsecureShop
jadx -d /workspace/shop-decompiled /apks/InsecureShop/InsecureShop.apk

# Ver estructura de archivos
ls /workspace/diva-decompiled/sources/jakhar/aseem/diva/

# Buscar strings hardcodeados
grep -r "password\|secret\|api_key\|token" /workspace/diva-decompiled/ --include="*.java" -i

# Buscar URLs
grep -rEo 'https?://[^"]+' /workspace/diva-decompiled/ | sort -u
```

---

## Parte 3 — apktool: Smali y Recursos

```bash
docker exec -it mobile-tools bash

# Descompilar APK (smali + recursos originales)
apktool d /apks/diva-android/diva-beta.apk -o /workspace/diva-smali

# Estructura generada
ls /workspace/diva-smali/
# smali/    → código ensamblador Dalvik
# res/      → recursos (layouts, strings, drawables)
# AndroidManifest.xml → manifiesto decodificado

# Ver AndroidManifest.xml
cat /workspace/diva-smali/AndroidManifest.xml

# Buscar actividades exportadas (sin protección)
grep -A3 'exported="true"' /workspace/diva-smali/AndroidManifest.xml

# Ver strings de recursos
cat /workspace/diva-smali/res/values/strings.xml

# Reempaquetar APK modificado
apktool b /workspace/diva-smali -o /workspace/diva-patched.apk
```

---

## Parte 4 — Análisis del AndroidManifest

Puntos clave a revisar:

```bash
docker exec -it mobile-tools bash

# Extraer solo el manifest (sin decompilar todo)
apktool d /apks/InsecureShop/InsecureShop.apk -o /workspace/shop-smali --no-src

cat /workspace/shop-smali/AndroidManifest.xml | grep -E \
    'exported|permission|debuggable|allowBackup|networkSecurityConfig'
```

| Atributo | Riesgo si `true` |
|----------|-----------------|
| `android:debuggable` | Permite debug remoto y acceso completo |
| `android:allowBackup` | Datos de la app extraíbles con ADB |
| `exported="true"` | Componente accesible desde otras apps |
| Sin `networkSecurityConfig` | Sin control de tráfico HTTP/HTTPS |

---

## Parte 5 — Búsqueda de Secretos

```bash
docker exec -it mobile-tools bash

# Descompilar
jadx -d /workspace/shop-decompiled /apks/InsecureShop/InsecureShop.apk

# Patrones de interés
grep -rn "apikey\|api_key\|secret\|password\|passwd\|Authorization\|Bearer" \
     /workspace/shop-decompiled/ --include="*.java" -i | head -30

# SharedPreferences (almacenamiento inseguro)
grep -rn "SharedPreferences\|getSharedPreferences\|MODE_WORLD" \
     /workspace/shop-decompiled/ --include="*.java"

# SQLite queries directas (posible SQLi)
grep -rn "rawQuery\|execSQL" \
     /workspace/shop-decompiled/ --include="*.java"
```

---

## Actividades

1. Generar reporte completo de MobSF para DIVA e InsecureShop
2. Identificar los 5 permisos más peligrosos en cada APK
3. Encontrar al menos un secreto hardcodeado con jadx
4. Localizar todas las actividades exportadas sin permiso
5. Modificar el `versionName` en el smali y reempaquetar

---

## Referencias

- [jadx GitHub](https://github.com/skylot/jadx)
- [Apktool Docs](https://apktool.org/)
- [MobSF REST API](https://mobsf.github.io/Mobile-Security-Framework-MobSF/restapi.html)
- [OWASP MASTG — Static Analysis](https://mas.owasp.org/MASTG/techniques/android/MASTG-TECH-0014/)
