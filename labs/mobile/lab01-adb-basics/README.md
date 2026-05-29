# Lab 01 — ADB Básico con Docker

## Objetivo

Usar Android Debug Bridge (ADB) para interactuar con el emulador Android corriendo en Docker, sin necesitar Android Studio instalado localmente.

---

## Entorno Docker

```
┌──────────────────────────────────────┐
│  Host (tu máquina)                   │
│                                      │
│  adb connect localhost:5555 ──────►  │ ──► [mobile-android:5555]
│                                      │
│  http://localhost:6080  ──────────►  │ ──► [noVNC - pantalla Android]
└──────────────────────────────────────┘
```

### Levantar el emulador

```bash
# Desde la raíz del módulo mobile
cd containers/mobile
docker compose up -d android

# O usar el script de setup completo
./scripts/setup.sh
```

El emulador tarda ~2 minutos en arrancar. Monitorea el progreso en:
**http://localhost:6080**

---

## Parte 1 — Conectar ADB

### Desde el host (si tienes adb instalado)

```bash
adb connect localhost:5555
adb devices
```

Salida esperada:
```
List of devices attached
localhost:5555   device
```

### Desde el container mobile-tools

```bash
docker exec -it mobile-tools bash

# Dentro del container:
adb connect mobile-android:5555
adb devices
```

---

## Parte 2 — ADB Shell

```bash
# Abrir shell en el dispositivo
adb -s localhost:5555 shell

# Comandos útiles dentro del shell
whoami
id
uname -a
ls /data/local/tmp

# Salir
exit
```

---

## Parte 3 — Instalar APK Vulnerable

```bash
# Instalar DIVA (Damn Insecure and Vulnerable App)
adb -s localhost:5555 install vulnerable-apps/diva-android/diva-beta.apk

# Instalar InsecureShop
adb -s localhost:5555 install vulnerable-apps/InsecureShop/InsecureShop.apk

# O usar el script automatizado
cd containers/mobile
./scripts/install-apks.sh
```

Verificar instalación:
```bash
adb -s localhost:5555 shell pm list packages | grep -E "diva|shop"
```

---

## Parte 4 — Logcat y Monitoreo

```bash
# Ver logs del dispositivo en tiempo real
adb -s localhost:5555 logcat

# Filtrar por tag específico
adb -s localhost:5555 logcat -s "DIVA"

# Filtrar por nivel (E=error, W=warning, I=info, D=debug)
adb -s localhost:5555 logcat "*:E"

# Logs de una app específica
PID=$(adb -s localhost:5555 shell pidof jakhar.aseem.diva)
adb -s localhost:5555 logcat --pid=$PID
```

---

## Parte 5 — Gestión de Paquetes

```bash
# Listar apps instaladas por usuario
adb -s localhost:5555 shell pm list packages -3

# Info de un paquete
adb -s localhost:5555 shell dumpsys package jakhar.aseem.diva

# Ruta del APK en el dispositivo
adb -s localhost:5555 shell pm path jakhar.aseem.diva

# Extraer APK del dispositivo al host
adb -s localhost:5555 pull $(adb -s localhost:5555 shell pm path jakhar.aseem.diva | cut -d: -f2 | tr -d '\r') /tmp/extracted.apk
```

---

## Parte 6 — File Transfer

```bash
# Subir archivo al dispositivo
adb -s localhost:5555 push /path/local/archivo.txt /sdcard/

# Descargar archivo del dispositivo
adb -s localhost:5555 pull /sdcard/archivo.txt /path/local/

# Ver contenido del almacenamiento
adb -s localhost:5555 shell ls -la /sdcard/
```

---

## Actividades

1. Levantar el emulador vía Docker y confirmar conexión ADB
2. Instalar las dos APKs vulnerables (DIVA + InsecureShop)
3. Explorar el filesystem del emulador con `adb shell`
4. Capturar los logs de DIVA al abrir la app
5. Extraer el APK instalado de vuelta al host

---

## Referencias

- [budtmo/docker-android en GitHub](https://github.com/budtmo/docker-android)
- [ADB Developers Reference](https://developer.android.com/tools/adb)
- [OWASP MSTG — Testing Environment Setup](https://mas.owasp.org/MASTG/tools/android/MASTG-TOOL-0004/)
