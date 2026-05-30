#!/bin/bash
# setup-users.sh — Poblar el dominio AD con usuarios y configuraciones vulnerables
set -e

echo "[*] Iniciando Samba AD DC..."
samba &
sleep 5

echo "[*] Creando OUs..."
samba-tool ou create "OU=Corp,DC=labthinktank,DC=local"
samba-tool ou create "OU=Users,OU=Corp,DC=labthinktank,DC=local"
samba-tool ou create "OU=Servers,OU=Corp,DC=labthinktank,DC=local"
samba-tool ou create "OU=ServiceAccounts,OU=Corp,DC=labthinktank,DC=local"

echo "[*] Creando usuarios..."
# Usuarios normales (contraseñas débiles para kerberoasting / password spray)
samba-tool user create jgarcia "Password123!" --given-name="Juan" --surname="Garcia" \
    --ou="OU=Users,OU=Corp,DC=labthinktank,DC=local" 2>/dev/null || true

samba-tool user create mlopez "Summer2024!" --given-name="Maria" --surname="Lopez" \
    --ou="OU=Users,OU=Corp,DC=labthinktank,DC=local" 2>/dev/null || true

samba-tool user create admin_svc "Svc@Pass2023!" --given-name="Service" --surname="Admin" \
    --ou="OU=ServiceAccounts,OU=Corp,DC=labthinktank,DC=local" 2>/dev/null || true

samba-tool user create sql_svc "sql_service_pass!" --given-name="SQL" --surname="Service" \
    --ou="OU=ServiceAccounts,OU=Corp,DC=labthinktank,DC=local" 2>/dev/null || true

samba-tool user create backup_svc "Backup@2023" --given-name="Backup" --surname="Service" \
    --ou="OU=ServiceAccounts,OU=Corp,DC=labthinktank,DC=local" 2>/dev/null || true

echo "[*] Configurando SPNs para Kerberoasting..."
samba-tool spn add "MSSQLSvc/sql01.labthinktank.local:1433" sql_svc 2>/dev/null || true
samba-tool spn add "HTTP/web01.labthinktank.local" admin_svc 2>/dev/null || true
samba-tool spn add "BACKUP/backup01.labthinktank.local" backup_svc 2>/dev/null || true

echo "[*] Configurando AS-REP Roasting (no requiere preauth)..."
samba-tool user setpassword mlopez --newpassword="Summer2024!" 2>/dev/null || true
# mlopez no requerirá preautenticación Kerberos (vulnerable a AS-REP Roasting)
python3 -c "
import subprocess
# Disable Kerberos preauth for mlopez
subprocess.run(['samba-tool','user','modify','mlopez',
    '--setattr=userAccountControl:4260352'], capture_output=True)
" 2>/dev/null || true

echo "[*] Creando grupos..."
samba-tool group add "IT-Admins" 2>/dev/null || true
samba-tool group add "Domain Computers" 2>/dev/null || true
samba-tool group addmembers "IT-Admins" jgarcia 2>/dev/null || true
samba-tool group addmembers "Domain Admins" admin_svc 2>/dev/null || true

echo "[*] Dominio configurado exitosamente."
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Dominio: LABTHINKTANK.LOCAL                  ║"
echo "║  Admin:   Administrator / Lab@Think2026!      ║"
echo "║  Users:   jgarcia / Password123!              ║"
echo "║           mlopez  / Summer2024! (AS-REP)      ║"
echo "║           sql_svc / sql_service_pass! (SPN)   ║"
echo "╚══════════════════════════════════════════════╝"

# Mantener Samba en primer plano
wait
