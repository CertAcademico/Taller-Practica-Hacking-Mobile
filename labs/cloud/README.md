# Cloud Security Labs

Módulo de seguridad en entornos cloud: misconfigurations AWS, escalada de privilegios IAM, explotación de IMDS via SSRF, seguridad en Kubernetes y escaneo de infraestructura como código.

---

## Arquitectura del Entorno

```
┌─────────────────────────────────────────────────────────────────────┐
│  Host                                                               │
│                                                                     │
│  http://localhost:4566  ──► LocalStack   (AWS simulado)             │
│    └── S3 · IAM · STS · Lambda · Secrets Manager · SSM             │
│                                                                     │
│  http://localhost:8181  ──► SSRF App     (vulnerable web app)       │
│  http://localhost:8169  ──► IMDS Mock    (169.254.169.254 simulado) │
│                                                                     │
│  docker exec -it cloud-tools bash                                   │
│    └── aws-cli · pacu · cloudfox · checkov · scoutsuite             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Inicio Rápido

```bash
cd labs/cloud
./containers/setup.sh

# Entrar al container de herramientas
docker exec -it cloud-tools bash

# Test rápido — listar buckets S3
aws --endpoint-url http://localstack:4566 s3 ls
```

---

## Labs

| Lab | Tema | Herramientas | OWASP/CSA | Dificultad |
|-----|------|-------------|-----------|-----------|
| [Lab 01](lab01-s3-iam/) | S3 Misconfiguration & IAM Enum | aws-cli, s3scanner | C6 | Principiante |
| [Lab 02](lab02-iam-privesc/) | IAM Privilege Escalation | Pacu, CloudFox | C5 | Intermedio |
| [Lab 03](lab03-imds-ssrf/) | IMDS Exploitation via SSRF | curl, aws-cli | C1 | Intermedio |
| [Lab 04](lab04-kubernetes/) | Kubernetes Security | kubectl, kube-hunter | C4 | Intermedio |
| [Lab 05](lab05-iac-scanning/) | IaC Security Scanning | Checkov, tfsec, truffleHog | C11 | Principiante |
| [Lab 06](lab06-cloud-pipeline/) | Cloud Attack Pipeline | Pacu, ScoutSuite | C1-C11 | Avanzado |

---

## Recursos del entorno LocalStack

| Recurso | Nombre | Configuración vulnerable |
|---------|--------|------------------------|
| S3 | labthinktank-public-data | ACL pública — expone datos sensibles |
| S3 | labthinktank-backups | Privado con backups cifrados |
| IAM User | dev-deploy | AdministratorAccess (over-permissive) |
| IAM Role | ec2-prod-role | AssumeRole desde cualquier EC2 |
| Secret | prod/database/credentials | Credenciales de producción |
| IMDS Mock | 169.254.169.254:80 | Credenciales IAM en metadatos |

---

## Referencias

- [OWASP Cloud Top 10](https://owasp.org/www-project-cloud-top-10/)
- [CSA Top Threats to Cloud](https://cloudsecurityalliance.org/research/top-threats/)
- [CloudGoat — Vulnerable AWS Labs](https://github.com/RhinoSecurityLabs/cloudgoat)
- [Pacu — AWS Exploitation Framework](https://github.com/RhinoSecurityLabs/pacu)
- [LocalStack](https://docs.localstack.cloud/)
