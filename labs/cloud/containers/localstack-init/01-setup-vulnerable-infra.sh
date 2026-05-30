#!/bin/bash
# Provisionar infraestructura AWS vulnerable en LocalStack
set -e
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
AWS="aws --endpoint-url http://localhost:4566"

echo "[*] Creando infraestructura vulnerable..."

# ── S3 Buckets ────────────────────────────────────────────────────────────────
# Bucket público (misconfiguration)
$AWS s3 mb s3://labthinktank-public-data
$AWS s3api put-bucket-acl --bucket labthinktank-public-data --acl public-read
$AWS s3 cp - s3://labthinktank-public-data/employees.csv <<'EOF'
name,email,role,salary
Juan Garcia,jgarcia@labthinktank.io,IT Admin,85000
Maria Lopez,mlopez@labthinktank.io,Developer,72000
Carlos Ruiz,cruiz@labthinktank.io,CISO,120000
EOF
$AWS s3 cp - s3://labthinktank-public-data/config.json <<'EOF'
{
  "db_host": "prod-db.labthinktank.internal",
  "db_user": "app_user",
  "db_password": "Prod@DB2026!",
  "api_key": "sk-prod-1234567890abcdef"
}
EOF

# Bucket privado con backup
$AWS s3 mb s3://labthinktank-backups
$AWS s3 cp - s3://labthinktank-backups/db_backup_2026.sql.gz.enc <<'EOF'
encrypted_backup_placeholder
EOF

# Bucket con versionado (para demostrar versiones expuestas)
$AWS s3 mb s3://labthinktank-code
$AWS s3api put-bucket-versioning \
    --bucket labthinktank-code \
    --versioning-configuration Status=Enabled

# ── IAM Users y Roles ─────────────────────────────────────────────────────────
# Usuario con credenciales hardcodeadas (over-permissive)
$AWS iam create-user --user-name dev-deploy
$AWS iam create-access-key --user-name dev-deploy \
    > /tmp/dev-deploy-keys.json
$AWS iam attach-user-policy --user-name dev-deploy \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess  # ← demasiado permiso

# Usuario con permisos mínimos (para comparar)
$AWS iam create-user --user-name read-only-user
$AWS iam attach-user-policy --user-name read-only-user \
    --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

# Rol con trust policy permisiva
$AWS iam create-role --role-name ec2-prod-role \
    --assume-role-policy-document '{
        "Version":"2012-10-17",
        "Statement":[{
            "Effect":"Allow",
            "Principal":{"Service":"ec2.amazonaws.com"},
            "Action":"sts:AssumeRole"
        }]
    }'
$AWS iam attach-role-policy --role-name ec2-prod-role \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# ── Secrets Manager (secretos accesibles) ─────────────────────────────────────
$AWS secretsmanager create-secret \
    --name prod/database/credentials \
    --secret-string '{"username":"admin","password":"ProdDB@2026!"}'

$AWS secretsmanager create-secret \
    --name prod/api/keys \
    --secret-string '{"stripe_key":"sk_live_abc123","sendgrid_key":"SG.xyz789"}'

# ── SSM Parameter Store ───────────────────────────────────────────────────────
$AWS ssm put-parameter \
    --name /prod/app/db-password \
    --value "InsecureParam2026!" \
    --type SecureString

echo "[+] Infraestructura vulnerable creada:"
echo "    S3:  labthinktank-public-data (público)"
echo "    S3:  labthinktank-backups (privado)"
echo "    IAM: dev-deploy (AdministratorAccess)"
echo "    Secrets: prod/database/credentials"
