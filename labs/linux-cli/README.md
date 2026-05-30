# Lab — Linux CLI

Fundamentos de la línea de comandos Linux orientados a ciberseguridad: navegación, permisos, procesos, redirecciones y herramientas de análisis del sistema.

---

## Objetivos

- Navegar el sistema de archivos con fluidez
- Gestionar permisos y usuarios
- Inspeccionar procesos y conexiones de red
- Encadenar comandos con pipes y redirecciones
- Buscar archivos y patrones de texto

---

## Parte 1 — Navegación y sistema de archivos

```bash
# Ubicación actual
pwd

# Listar con detalles (permisos, tamaño, fecha)
ls -lah

# Navegar
cd /var/log
cd ~          # home
cd -          # directorio anterior

# Ver árbol de directorios
tree -L 2 /etc

# Información del sistema
uname -a
hostname
whoami
id
```

---

## Parte 2 — Permisos

```bash
# Ver permisos de un archivo
ls -la /etc/passwd

# Cambiar permisos (octal)
chmod 755 script.sh      # rwxr-xr-x
chmod 644 archivo.txt    # rw-r--r--
chmod +x script.sh       # añadir ejecución

# Cambiar propietario
chown usuario:grupo archivo.txt
chown -R www-data /var/www/html

# Permisos especiales
chmod u+s binario        # SUID — ejecuta como propietario
chmod g+s directorio     # SGID
chmod +t /tmp            # Sticky bit
```

### Tabla de referencia

| Octal | Simbólico | Significado |
|-------|-----------|-------------|
| 7 | rwx | Lectura + escritura + ejecución |
| 6 | rw- | Lectura + escritura |
| 5 | r-x | Lectura + ejecución |
| 4 | r-- | Solo lectura |
| 0 | --- | Sin permisos |

---

## Parte 3 — Usuarios y grupos

```bash
# Ver usuarios del sistema
cat /etc/passwd
cut -d: -f1 /etc/passwd    # solo nombres

# Ver grupos
cat /etc/group
groups usuario

# Crear usuario
useradd -m -s /bin/bash nuevo_usuario
passwd nuevo_usuario

# Añadir a grupo sudo
usermod -aG sudo nuevo_usuario

# Cambiar de usuario
su - usuario
sudo -l                    # ver permisos sudo del usuario actual
sudo -u www-data whoami
```

---

## Parte 4 — Procesos

```bash
# Ver procesos en ejecución
ps aux
ps aux | grep nginx

# Vista dinámica
top
htop               # más visual (instalar si no está)

# Ver árbol de procesos
pstree -p

# Matar proceso
kill -9 PID
pkill -f "nombre_proceso"

# Ver proceso por puerto
lsof -i :80
lsof -i :443
ss -tlnp | grep :22
```

---

## Parte 5 — Red desde la línea de comandos

```bash
# Interfaces de red
ip a
ifconfig          # legacy

# Tabla de rutas
ip route
route -n

# Conexiones activas
ss -tlnp          # TCP en escucha
ss -anp           # todas las conexiones
netstat -tlnp     # alternativa legacy

# Resolución DNS
nslookup google.com
dig google.com
host google.com

# Conectividad
ping -c 4 8.8.8.8
traceroute 8.8.8.8
curl -I https://example.com
```

---

## Parte 6 — Búsqueda y texto

```bash
# Buscar archivos
find / -name "*.conf" 2>/dev/null
find /home -type f -perm -004    # archivos world-readable
find / -perm -u=s -type f 2>/dev/null   # binarios SUID

# Buscar contenido
grep -rn "password" /etc/ 2>/dev/null
grep -i "error" /var/log/syslog | tail -20

# Manipulación de texto
cat /etc/passwd | cut -d: -f1,3,6
awk -F: '{print $1, $3}' /etc/passwd
sed 's/root/ROOT/g' /etc/passwd
sort -t: -k3 -n /etc/passwd      # ordenar por UID

# Contar líneas / palabras
wc -l /etc/passwd
grep -c "bash" /etc/passwd
```

---

## Parte 7 — Pipes, redirecciones y variables

```bash
# Redirigir salida
comando > archivo.txt     # sobreescribir
comando >> archivo.txt    # añadir
comando 2>/dev/null       # descartar errores
comando 2>&1 | tee log.txt  # stdout + stderr a archivo y pantalla

# Pipes
ps aux | grep root | awk '{print $11}' | sort -u
cat /etc/passwd | grep "/bin/bash" | cut -d: -f1

# Variables
OBJETIVO="192.168.1.1"
echo "Escaneando $OBJETIVO"
export PATH=$PATH:/opt/tools/bin

# Variables de entorno útiles
env
echo $HOME $PATH $SHELL $USER
```

---

## Actividades

1. Listar todos los usuarios con shell `/bin/bash` en el sistema
2. Encontrar todos los archivos con bit SUID activo en `/usr/bin`
3. Ver qué proceso está escuchando en el puerto 22
4. Buscar la palabra `password` (sin distinguir mayúsculas) en `/etc/` recursivamente
5. Crear un script que muestre: IP local, usuarios activos y servicios en escucha

---

## Relevancia en ciberseguridad

| Técnica | Comando clave | MITRE ATT&CK |
|---------|--------------|--------------|
| Enumeración de usuarios | `cat /etc/passwd`, `id` | T1087.001 |
| Archivos SUID (privesc) | `find / -perm -u=s` | T1548.001 |
| Conexiones activas | `ss -tlnp`, `lsof` | T1049 |
| Búsqueda de credenciales | `grep -r "password"` | T1552.001 |
| Historial de comandos | `cat ~/.bash_history` | T1552.003 |

---

## Referencias

- [The Linux Command Line — William Shotts](https://linuxcommand.org/tlcl.php) (gratuito)
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/) — wargame de Linux CLI
- [GTFOBins](https://gtfobins.github.io/) — binarios para escalada de privilegios
