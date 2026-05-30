# main.tf — Infraestructura AWS deliberadamente insegura para el lab
# Propósito: practicar IaC security scanning con Checkov y tfsec
# NO desplegar en entornos reales

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"           # ← secreto hardcodeado
  secret_key                  = "test"           # ← secreto hardcodeado
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  endpoints {
    s3  = "http://localhost:4566"
    iam = "http://localhost:4566"
    sts = "http://localhost:4566"
  }
}

# ═══════════════════════════════════════════════════════════
# S3 — Misconfigurations
# ═══════════════════════════════════════════════════════════

# ❌ Bucket público sin cifrado ni logging
resource "aws_s3_bucket" "public_data" {
  bucket = "labthinktank-public-vulnerable"
  # CKV_AWS_19: no encryption
  # CKV_AWS_18: no logging
  # CKV_AWS_21: no versioning
}

# ❌ ACL pública
resource "aws_s3_bucket_acl" "public_acl" {
  bucket = aws_s3_bucket.public_data.id
  acl    = "public-read"   # CKV_AWS_20
}

# ❌ Block Public Access deshabilitado
resource "aws_s3_bucket_public_access_block" "public_data" {
  bucket                  = aws_s3_bucket.public_data.id
  block_public_acls       = false   # CKV_AWS_53
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# ═══════════════════════════════════════════════════════════
# IAM — Políticas excesivas
# ═══════════════════════════════════════════════════════════

# ❌ Política con wildcard en acciones y recursos
resource "aws_iam_policy" "admin_wildcard" {
  name = "admin-wildcard-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "*"      # CKV_AWS_110: wildcard actions
      Resource = "*"      # CKV_AWS_41: wildcard resources
    }]
  })
}

# ❌ Usuario con AdminAccess directo
resource "aws_iam_user" "over_privileged" {
  name = "over-privileged-user"
}

resource "aws_iam_user_policy_attachment" "admin" {
  user       = aws_iam_user.over_privileged.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# ❌ Access key hardcodeada en outputs (expuesta en state)
resource "aws_iam_access_key" "exposed_key" {
  user = aws_iam_user.over_privileged.name
}

output "secret_access_key" {
  value     = aws_iam_access_key.exposed_key.secret   # ← expone secreto
  sensitive = false   # CKV_TF_1: debería ser sensitive = true
}

# ═══════════════════════════════════════════════════════════
# Security Groups — Puertos abiertos a internet
# ═══════════════════════════════════════════════════════════

# ❌ SSH y RDP abiertos a todo internet
resource "aws_security_group" "open_ports" {
  name        = "open-to-world"
  description = "insecure security group"

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]   # CKV_AWS_23
  }

  ingress {
    description = "RDP from anywhere"
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]   # CKV_AWS_25
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ═══════════════════════════════════════════════════════════
# Variables con secretos hardcodeados
# ═══════════════════════════════════════════════════════════

variable "db_password" {
  description = "Database password"
  default     = "Prod@DB2026!"   # ← truffleHog lo detectará
  # CKV_TF_2: sensitive = true faltante
}

variable "api_key" {
  description = "External API key"
  default     = "sk-prod-1234567890abcdef"  # ← truffleHog lo detectará
}
