# Lab 04 — People OSINT

## Objetivo

Recolectar información sobre personas de interés (empleados, ejecutivos, administradores de sistemas) usando fuentes públicas: LinkedIn, redes sociales, brechas de datos y motores especializados.

> **Importante:** Este lab es para entender cómo los atacantes preparan ataques dirigidos (spear phishing, vishing). Usar solo en contexto de pruebas autorizadas o contra perfiles propios.

---

## Parte 1 — LinkedIn OSINT

LinkedIn es la fuente más valiosa para identificar empleados, tecnologías usadas y estructura organizacional.

### Búsquedas manuales

```
# Encontrar empleados de una empresa
site:linkedin.com/in "Bancolombia" "CISO" OR "seguridad" OR "security"
site:linkedin.com/in "empresa.com"

# Encontrar tecnologías usadas (por descripción del perfil)
site:linkedin.com/in "Bancolombia" "Splunk" OR "CrowdStrike" OR "Palo Alto"

# Encontrar el equipo de IT/seguridad
site:linkedin.com/in "empresa" "network engineer" OR "sysadmin" OR "cloud architect"
```

### Información útil del perfil

```
Nombre completo → email corporativo (ver Parte 3)
Cargo → nivel de acceso probable
Skills técnicas → tecnologías de la empresa
Certificaciones → madurez de seguridad
Historial laboral → ex-empleados (acceso revocado?)
Publicaciones → información técnica que comparten
```

### Hunter.io — Formato de email corporativo

```bash
# Hunter.io encuentra el patrón de emails de una empresa
# https://hunter.io/domain-search

# API gratuita (100 búsquedas/mes)
curl "https://api.hunter.io/v2/domain-search?domain=empresa.com&api_key=TU_KEY" \
    | python3 -m json.tool | grep -E "value|pattern"

# Si el patrón es {first}.{last}@empresa.com
# y encontraste a "Juan García" en LinkedIn
# → juan.garcia@empresa.com
```

---

## Parte 2 — Redes sociales

```bash
# Sherlock — buscar un username en 300+ redes sociales
pip3 install sherlock-project
sherlock username_objetivo

# Maigret (fork mejorado de Sherlock)
pip3 install maigret
maigret username_objetivo --top-sites 100

# Resultados muestran en qué plataformas existe el perfil
```

### Twitter/X OSINT

```bash
# Tweets que mencionan la empresa
# En Twitter Advanced Search:
from:@empleado_objetivo

# Twint (scraping sin API)
twint -u username_objetivo --limit 100
twint -s "empresa.com" --since 2024-01-01
```

---

## Parte 3 — Have I Been Pwned & Brechas de datos

```bash
# Verificar si un email aparece en brechas conocidas
# https://haveibeenpwned.com

# API (requiere key)
curl -H "hibp-api-key: TU_KEY" \
     "https://haveibeenpwned.com/api/v3/breachedaccount/correo@empresa.com"

# Herramienta h8mail (automatizada)
pip3 install h8mail
h8mail -t correo@empresa.com

# DeHashed (base de datos de brechas)
# https://dehashed.com — búsquedas de email, username, IP, hash
```

### Por qué importa en pentesting

Si un empleado aparece en una brecha:
- Su contraseña filtrada podría ser la misma que usa en la empresa
- Permite ataques de **credential stuffing**: probar la contraseña en VPN/Outlook/portal corporativo
- Puede revelar el patrón de contraseñas del usuario

---

## Parte 4 — SpiderFoot (automatizado)

SpiderFoot automatiza la recolección OSINT sobre personas, dominios, IPs y emails.

```bash
# Con el entorno Docker levantado:
# http://localhost:5009

# Crear un nuevo scan:
# 1. New Scan
# 2. Target: correo@empresa.com  (o dominio)
# 3. Scan Preset: "Footprint" (pasivo) o "Investigate" (activo)
# 4. Run Scan

# Módulos relevantes para people OSINT:
# - sfp_email → valida email
# - sfp_haveibeenpwned → brechas
# - sfp_linkedln → LinkedIn
# - sfp_hunter → Hunter.io
# - sfp_shodan → Shodan (si tienes key)
```

---

## Parte 5 — Construir un perfil de ataque

Al terminar el recon de personas, organizar la información en:

```markdown
# Perfil OSINT — [Objetivo]

## Datos básicos
- Nombre completo: Juan García López
- Email corporativo: juan.garcia@empresa.com (patrón detectado)
- LinkedIn: linkedin.com/in/juangarcia
- Twitter: @jgarcia_tech

## Información técnica
- Cargo: Network Engineer Senior
- Tecnologías: Cisco, Palo Alto, AWS, Python
- Certificaciones: CCNP, AWS Solutions Architect

## Vectores de ataque identificados
- Email en brecha Linkedin2021 → contraseña: JGarcia$2019
- Twitter público con tweets sobre problemas técnicos
- GitHub: https://github.com/jgarcia-tech (repos privados con emails)

## Posibles escenarios
1. Spear phishing haciéndose pasar por Cisco TAC
2. Credential stuffing en VPN corporativa con contraseña de la brecha
3. Vishing: llamada como "soporte de AWS" sobre "alerta de seguridad"
```

---

## Parte 6 — recon-ng

recon-ng es un framework modular de reconocimiento similar a Metasploit pero para OSINT.

```bash
# Iniciar
recon-ng

# Crear workspace
workspaces create empresa_target

# Agregar dominio objetivo
db insert domains
> domain: empresa.com

# Usar módulos
marketplace install recon/domains-hosts/hackertarget
modules load recon/domains-hosts/hackertarget
run

marketplace install recon/hosts-hosts/resolve
modules load recon/hosts-hosts/resolve
run

# Ver resultados
show hosts
show contacts
show credentials

# Generar reporte
marketplace install reporting/html
modules load reporting/html
run
```

---

## Actividades

1. Encontrar 5 empleados de una empresa de práctica usando LinkedIn + Google Dorks
2. Determinar el patrón de email corporativo con Hunter.io
3. Verificar si algún email encontrado aparece en brechas conocidas (HIBP)
4. Usar Sherlock para buscar un username en redes sociales
5. Crear un perfil OSINT completo de un objetivo ficticio consolidando toda la información

---

## Referencias

- [Have I Been Pwned](https://haveibeenpwned.com)
- [Hunter.io](https://hunter.io)
- [Sherlock](https://github.com/sherlock-project/sherlock)
- [SpiderFoot](https://github.com/smicallef/spiderfoot)
- [recon-ng Wiki](https://github.com/lanmaster53/recon-ng/wiki)
- [OSINT Framework — People](https://osintframework.com/)
