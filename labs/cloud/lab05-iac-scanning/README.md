# Lab 05 — IaC Security Scanning

## Objetivo

Detectar misconfiguraciones de seguridad en infraestructura como código (Terraform) antes del despliegue, y encontrar secretos hardcodeados en repositorios y configuraciones cloud.

---

## Infraestructura vulnerable del lab

El directorio `terraform/vulnerable-infra/` contiene código Terraform deliberadamente inseguro para practicar.

---

## Parte 1 — Checkov (IaC Scanner)

Checkov analiza Terraform, CloudFormation, Kubernetes YAML, Helm, Dockerfile y más.

```bash
# Escanear directorio de Terraform
checkov -d /workspace/terraform/vulnerable-infra/

# Solo hallazgos críticos y altos
checkov -d /workspace/terraform/vulnerable-infra/ \
    --check CRITICAL,HIGH

# Output en JSON para procesar
checkov -d /workspace/terraform/vulnerable-infra/ \
    -o json | python3 -m json.tool | head -80

# Escanear solo archivos .tf
checkov -d /workspace/terraform/vulnerable-infra/ \
    --framework terraform

# Ver solo los checks fallidos
checkov -d /workspace/terraform/vulnerable-infra/ \
    --compact

# Generar reporte SARIF (para integración con GitHub/GitLab)
checkov -d /workspace/terraform/vulnerable-infra/ \
    -o sarif > /workspace/reports/checkov_report.sarif
```

### Checks más importantes de AWS

| Check ID | Descripción | Severidad |
|----------|-------------|-----------|
| CKV_AWS_18 | S3 sin logging | Medium |
| CKV_AWS_19 | S3 sin cifrado | High |
| CKV_AWS_20 | S3 ACL pública | High |
| CKV_AWS_21 | S3 sin versionado | Low |
| CKV_AWS_53 | S3 Block Public Access no habilitado | High |
| CKV_AWS_41 | IAM policy con * en recursos | High |
| CKV_AWS_110 | IAM policy con * en acciones | Critical |
| CKV_AWS_23 | SG con 0.0.0.0/0 en puerto 22 | High |
| CKV_AWS_25 | SG con 0.0.0.0/0 en puerto 3389 | High |
| CKV_AWS_2 | ELB sin HTTPS | Medium |

---

## Parte 2 — tfsec

```bash
# Instalar
go install github.com/aquasecurity/tfsec/cmd/tfsec@latest

# Escanear
tfsec /workspace/terraform/vulnerable-infra/

# Con más detalle
tfsec /workspace/terraform/vulnerable-infra/ --include-passed

# Solo severidad específica
tfsec /workspace/terraform/vulnerable-infra/ \
    --minimum-severity HIGH

# Ignorar un check específico (falso positivo)
# Añadir al código:
# #tfsec:ignore:aws-s3-enable-bucket-logging
```

---

## Parte 3 — truffleHog (secretos en código)

```bash
# Buscar secretos en un directorio local
trufflehog filesystem /workspace/terraform/ \
    --json | python3 -m json.tool

# Buscar en un repositorio git
trufflehog git file:///workspace/repo \
    --only-verified

# Buscar en S3 (requiere credenciales AWS)
trufflehog s3 \
    --bucket=labthinktank-public-data \
    --endpoint http://localstack:4566

# Buscar en variables de entorno del container
trufflehog docker --image cloud-tools
```

### Patrones de secretos que detecta

```
AWS Access Keys:    AKIA[0-9A-Z]{16}
AWS Session Token:  //credentials.*SessionToken
GitHub Token:       ghp_[0-9a-zA-Z]{36}
Stripe Key:         sk_live_[0-9a-zA-Z]{24}
Slack Token:        xox[baprs]-[0-9a-zA-Z-]+
Private Keys:       -----BEGIN (RSA|EC|DSA) PRIVATE KEY-----
```

---

## Parte 4 — Terraform vulnerable de ejemplo

```hcl
# terraform/vulnerable-infra/main.tf — INSEGURO (para el lab)

provider "aws" {
  region = "us-east-1"
}

# ❌ Bucket S3 sin cifrado y con ACL pública
resource "aws_s3_bucket" "public_data" {
  bucket = "labthinktank-datos-publicos"
  acl    = "public-read"   # ← CKV_AWS_20
}

# ❌ Security Group con SSH abierto a internet
resource "aws_security_group" "open_sg" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]   # ← CKV_AWS_23
  }
  ingress {
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]   # ← CKV_AWS_25
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ❌ IAM policy con permisos excesivos (wildcard)
resource "aws_iam_policy" "admin_policy" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "*"           # ← CKV_AWS_110
      Resource = "*"           # ← CKV_AWS_41
    }]
  })
}

# ❌ Credencial hardcodeada en variable (detectada por truffleHog)
variable "db_password" {
  default = "Prod@DB2026!"    # ← secreto expuesto
}

# ❌ RDS sin cifrado en reposo
resource "aws_db_instance" "prod_db" {
  identifier        = "prod-database"
  engine            = "mysql"
  instance_class    = "db.t3.micro"
  username          = "admin"
  password          = var.db_password
  storage_encrypted = false    # ← CKV_AWS_17
  publicly_accessible = true   # ← CKV_AWS_17
}
```

---

## Parte 5 — ScoutSuite (auditoría multi-cloud)

```bash
# Auditar cuenta AWS (LocalStack)
scout aws \
    --endpoint-url http://localstack:4566 \
    --access-key-id test \
    --secret-access-key test \
    --region us-east-1 \
    --no-browser \
    --report-dir /workspace/reports/scoutsuite/

# Abrir el reporte HTML
# (copiar a host y abrir en navegador)
```

---

## Actividades

1. Escanear `terraform/vulnerable-infra/` con Checkov y documentar los 5 hallazgos más críticos
2. Comparar resultados de Checkov vs tfsec sobre el mismo código
3. Usar truffleHog para encontrar secretos hardcodeados en el directorio de Terraform
4. Corregir 3 misconfiguraciones del código Terraform y verificar que Checkov ya no las reporta
5. Generar un reporte SARIF y analizar su estructura

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| Unsecured Credentials in files | T1552.001 |
| Cloud Infrastructure Discovery | T1580 |
| Misconfigured Cloud Storage | T1530 |
