# Active Directory Labs

Módulo de pentesting de entornos Windows Active Directory: enumeración, ataques Kerberos, movimiento lateral y escalada de privilegios hasta Domain Admin.

---

## Arquitectura del Entorno

```
┌──────────────────────────────────────────────────────────────────────┐
│  Red interna: 192.168.100.0/24                                       │
│                                                                      │
│  192.168.100.10  ── DC01 (Samba AD DC)                               │
│    Dominio: LABTHINKTANK.LOCAL                                       │
│    Puertos: LDAP:389, SMB:445, Kerberos:88, DNS:53                   │
│                                                                      │
│  192.168.100.50  ── ad-tools (atacante)                              │
│    impacket · NetExec · BloodHound · Kerbrute · Responder            │
│                                                                      │
│  http://localhost:8080  ── BloodHound Community Edition              │
│  http://localhost:7474  ── Neo4j Browser                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Inicio Rápido

```bash
cd labs/ad
./containers/setup.sh

# Entrar al container de ataque
docker exec -it ad-tools bash

# Verificar conectividad con el DC
nxc smb 192.168.100.10
```

---

## Credenciales del laboratorio

| Usuario | Contraseña | Notas |
|---------|-----------|-------|
| Administrator | Lab@Think2026! | Domain Admin |
| jgarcia | Password123! | IT-Admins group |
| mlopez | Summer2024! | AS-REP Roastable |
| sql_svc | sql_service_pass! | SPN → Kerberoastable |
| admin_svc | Svc@Pass2023! | Domain Admin (SPN) |
| backup_svc | Backup@2023 | SPN configurado |

---

## Labs

| Lab | Técnica | Herramientas | MITRE | Dificultad |
|-----|---------|-------------|-------|-----------|
| [Lab 01](lab01-enumeration/) | Enumeración AD | ldapsearch, enum4linux, NetExec | T1087 | Principiante |
| [Lab 02](lab02-kerberoasting/) | Kerberoasting & AS-REP | impacket, hashcat | T1558 | Intermedio |
| [Lab 03](lab03-pth-ptt/) | Pass-the-Hash / Pass-the-Ticket | impacket, NetExec | T1550 | Intermedio |
| [Lab 04](lab04-bloodhound/) | BloodHound Attack Paths | BloodHound CE, Neo4j | T1069 | Intermedio |
| [Lab 05](lab05-dcsync/) | DCSync & Golden Ticket | secretsdump, mimikatz | T1003 | Avanzado |
| [Lab 06](lab06-lateral-movement/) | Lateral Movement | wmiexec, psexec, evil-winrm | T1021 | Avanzado |

---

## Referencias

- [Hack The Box Academy — Active Directory](https://academy.hackthebox.com/module/details/74)
- [PayloadsAllTheThings — Active Directory](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Active%20Directory%20Attack.md)
- [BloodHound Community Edition](https://github.com/SpecterOps/BloodHound)
- [Impacket](https://github.com/fortra/impacket)
- [NetExec](https://github.com/Pennyw0rth/NetExec)
