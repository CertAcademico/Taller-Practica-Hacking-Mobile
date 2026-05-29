# Lab 04 — Frida Basics con Docker

## Objetivo

Usar Frida para instrumentación dinámica de apps Android en el emulador Docker: hooking de funciones, bypass de controles y extracción de datos en tiempo de ejecución.

---

## Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│  mobile-tools container                                        │
│  frida-tools / objection  ──────────────────────┐             │
└──────────────────────────────────────────────────┼─────────────┘
                                                   │ TCP (frida protocol)
┌──────────────────────────────────────────────────┼─────────────┐
│  mobile-android container (Android 11)           │             │
│  frida-server  ◄─────────────────────────────────┘             │
│  target app (DIVA / InsecureShop)                              │
└────────────────────────────────────────────────────────────────┘
```

---

## Parte 1 — Instalar frida-server en el Emulador

```bash
# Script automatizado
cd containers/mobile
./scripts/frida-push.sh

# O manualmente:
FRIDA_VERSION="16.5.9"

# Descargar frida-server para Android x86 (arquitectura del emulador)
curl -sL "https://github.com/frida/frida/releases/download/${FRIDA_VERSION}/frida-server-${FRIDA_VERSION}-android-x86.xz" \
    | xz -d > /tmp/frida-server

# Subir al emulador
adb -s localhost:5555 push /tmp/frida-server /data/local/tmp/frida-server
adb -s localhost:5555 shell chmod 755 /data/local/tmp/frida-server

# Iniciar en background (dentro del shell del emulador)
adb -s localhost:5555 shell "/data/local/tmp/frida-server &"
```

---

## Parte 2 — Verificar Conexión Frida

```bash
# Desde mobile-tools container
docker exec -it mobile-tools bash

# Listar procesos del dispositivo
frida-ps -H mobile-android:5555

# Listar solo apps instaladas
frida-ps -H mobile-android:5555 -a

# Buscar proceso específico
frida-ps -H mobile-android:5555 | grep -i diva
```

---

## Parte 3 — Primeros Hooks con Frida REPL

### Lanzar app con Frida

```bash
docker exec -it mobile-tools bash

# Adjuntarse a proceso en ejecución
frida -H mobile-android:5555 -n "jakhar.aseem.diva"

# O spawnear la app
frida -H mobile-android:5555 -f jakhar.aseem.diva --no-pause
```

### Comandos en el REPL

```javascript
// Ver módulos cargados
Process.enumerateModules()

// Listar clases Java
Java.enumerateLoadedClassesSync().filter(c => c.includes("DIVA"))

// Obtener métodos de una clase
Java.use("jakhar.aseem.diva.DivaActivity").class.getDeclaredMethods()
```

---

## Parte 4 — Scripts Frida

### Hook básico — interceptar credenciales

Crea el archivo `/workspace/hook-login.js` en el container:

```javascript
Java.perform(function() {
    // Hook al método de validación de login
    var Activity = Java.use("jakhar.aseem.diva.InsecureBankingActivity2");

    Activity.performLogin.overload('java.lang.String', 'java.lang.String')
        .implementation = function(user, pass) {
            console.log("[*] Login interceptado!");
            console.log("    Usuario: " + user);
            console.log("    Password: " + pass);

            // Llamar al método original
            return this.performLogin(user, pass);
        };
});
```

```bash
# Ejecutar el script
frida -H mobile-android:5555 -f jakhar.aseem.diva \
      --no-pause -l /workspace/hook-login.js
```

### Hook de SQLite — capturar queries

```javascript
Java.perform(function() {
    var SQLiteDatabase = Java.use("android.database.sqlite.SQLiteDatabase");

    SQLiteDatabase.rawQuery.overload('java.lang.String', '[Ljava.lang.String;')
        .implementation = function(sql, args) {
            console.log("[SQL] " + sql);
            if (args) console.log("[SQL ARGS] " + JSON.stringify(args));
            return this.rawQuery(sql, args);
        };
});
```

### Hook de SharedPreferences — ver datos guardados

```javascript
Java.perform(function() {
    var SharedPreferences = Java.use("android.app.SharedPreferencesImpl");

    SharedPreferences.getString.overload('java.lang.String', 'java.lang.String')
        .implementation = function(key, defVal) {
            var val = this.getString(key, defVal);
            console.log("[PREFS] " + key + " = " + val);
            return val;
        };
});
```

---

## Parte 5 — Objection (Frida con esteroides)

```bash
docker exec -it mobile-tools bash

# Conectar con objection
objection -N -h mobile-android -p 5555 -g jakhar.aseem.diva explore

# Comandos útiles dentro de objection:
# Ver archivos de la app
files ls

# SharedPreferences
android sharedpreferences get

# Ver keystore
android keystore list

# Root detection bypass
android root disable

# Hookear clase específica
android hooking watch class_method jakhar.aseem.diva.DivaActivity.onResume

# Ver actividad actual
android hooking get current_activity

# Exportar memoria
memory dump all /tmp/memdump.bin
```

---

## Actividades

1. Instalar frida-server en el emulador y verificar la conexión
2. Listar todas las clases de DIVA con `Java.enumerateLoadedClassesSync()`
3. Hookear el método de validación de hardcoded credentials en DIVA
4. Usar objection para volcar las SharedPreferences de DIVA
5. Interceptar y loggear todas las queries SQLite en tiempo real

---

## Referencias

- [Frida Documentation](https://frida.re/docs/)
- [Objection GitHub](https://github.com/sensepost/objection)
- [OWASP MASTG — Dynamic Analysis](https://mas.owasp.org/MASTG/techniques/android/MASTG-TECH-0043/)
- [Frida Cheatsheet — Mobi](https://github.com/iddoeldor/frida-snippets)
