# MITRE ATT&CK — Mapping LabThinkTank

Mapeo de las técnicas cubiertas en los labs y cursos de LabThinkTank contra el framework MITRE ATT&CK Enterprise y Mobile.

---

## ¿Qué es MITRE ATT&CK?

MITRE ATT&CK es una base de conocimiento de tácticas y técnicas adversarias basadas en observaciones del mundo real. Se organiza en:

- **Tácticas (TA):** el *objetivo* del adversario (ej. Reconocimiento, Persistencia, Exfiltración)
- **Técnicas (T):** *cómo* logra ese objetivo
- **Sub-técnicas:** variaciones específicas de una técnica
- **Procedimientos:** implementaciones concretas observadas en grupos APT

---

## Matriz Enterprise — Técnicas cubiertas

### TA0043 — Reconnaissance

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1595 | Active Scanning | nmap, nuclei → [labs/redes](../../labs/redes/) |
| T1595.001 | Scanning IP Blocks | nmap -sn, rustscan |
| T1595.002 | Vulnerability Scanning | nuclei, nmap --script=vuln |
| T1590 | Gather Victim Network Info | nmap -A, shodan |
| T1590.001 | Domain Properties | subfinder, whois |
| T1590.004 | Network Topology | traceroute, nmap |
| T1592 | Gather Victim Host Info | nmap -O |
| T1592.001 | Hardware | nmap OS detection |
| T1592.002 | Software | nmap -sV, whatweb |
| T1589 | Gather Victim Identity Info | theHarvester, OSINT |
| T1589.002 | Email Addresses | theHarvester, grep regex |

### TA0001 — Initial Access

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1190 | Exploit Public-Facing Application | nuclei, burpsuite |
| T1078 | Valid Accounts | credential stuffing, hydra |
| T1566 | Phishing | GoPhish (planificado) |

### TA0002 — Execution

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1059 | Command and Scripting Interpreter | bash scripts → [labs/bash-scripting](../../labs/bash-scripting/) |
| T1059.004 | Unix Shell | bash, sh, zsh |
| T1106 | Native API | frida hooks → [labs/mobile](../../labs/mobile/) |

### TA0003 — Persistence

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1543 | Create or Modify System Process | cron, systemd |
| T1098 | Account Manipulation | usermod, useradd |
| T1505.003 | Web Shell | webshell upload (web labs) |

### TA0004 — Privilege Escalation

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1548.001 | Setuid and Setgid | find -perm -u=s → [labs/linux-cli](../../labs/linux-cli/) |
| T1548.003 | Sudo and Sudo Caching | sudo -l, GTFOBins |
| T1611 | Escape to Host | Docker breakout |

### TA0005 — Defense Evasion

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1070.003 | Clear Command History | history -c, HISTFILE=/dev/null |
| T1036 | Masquerading | renombrar binarios |
| T1027 | Obfuscated Files or Information | base64, xor en scripts |

### TA0006 — Credential Access

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1552.001 | Credentials in Files | grep -r "password" → linux-cli lab |
| T1552.003 | Bash History | cat ~/.bash_history |
| T1557 | Adversary-in-the-Middle | bettercap, mitmproxy → redes lab |
| T1040 | Network Sniffing | tcpdump, wireshark → redes lab |
| T1110 | Brute Force | hydra, hashcat → crypto lab |
| T1110.002 | Password Cracking | hashcat, john → [docs/fundamentos/criptografia](../fundamentos/criptografia-basica.md) |

### TA0007 — Discovery

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1046 | Network Service Discovery | nmap → [labs/redes](../../labs/redes/) |
| T1049 | System Network Connections | ss, netstat, lsof → linux-cli |
| T1087.001 | Local Account Discovery | cat /etc/passwd → linux-cli |
| T1083 | File and Directory Discovery | find, ls -la → linux-cli |
| T1082 | System Information Discovery | uname -a, id, hostname |
| T1016 | System Network Configuration Discovery | ip a, route |

### TA0008 — Lateral Movement

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1021.002 | SMB/Windows Admin Shares | nmap smb scripts, netexec |
| T1021.004 | SSH | ssh key abuse |
| T1550.002 | Pass the Hash | impacket (AD labs — planificado) |

### TA0010 — Exfiltration

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1048 | Exfiltration Over Alternative Protocol | curl, dns tunneling |
| T1132.001 | Standard Encoding | base64 data exfil → crypto lab |

### TA0011 — Command and Control

| ID | Técnica | Herramienta / Lab |
|----|---------|------------------|
| T1095 | Non-Application Layer Protocol | netcat reverse shells |
| T1071.001 | Web Protocols | HTTP C2 (red team ops — planificado) |

---

## Matriz Mobile — Técnicas cubiertas

### M-TA0035 — Initial Access (Mobile)

| ID | Técnica | Lab |
|----|---------|-----|
| T1476 | Deliver Malicious App | InsecureShop, DIVA → [labs/mobile](../../labs/mobile/) |
| T1458 | Repackaged Application | apktool → lab02 |

### M-TA0038 — Credential Access (Mobile)

| ID | Técnica | Lab |
|----|---------|-----|
| T1409 | Access Sensitive Data in Device Logs | adb logcat → lab01 |
| T1429 | Capture Audio | análisis de permisos → MobSF |
| T1411 | Input Prompt | hooking con Frida → lab04 |

### M-TA0030 — Execution (Mobile)

| ID | Técnica | Lab |
|----|---------|-----|
| T1575 | Native Code | Frida dynamic instrumentation → lab04 |
| T1623 | Command and Scripting Interpreter | adb shell → lab01 |

### M-TA0037 — Network Effects (Mobile)

| ID | Técnica | Lab |
|----|---------|-----|
| T1439 | Eavesdrop on Insecure Network Communication | mitmproxy → lab03 |
| T1465 | Rogue Wi-Fi Access Points | análisis SSL pinning → lab06 |

---

## Grupos APT referenciados en los cursos

| Grupo | Alias | Sector objetivo | Curso relacionado |
|-------|-------|----------------|------------------|
| APT28 | Fancy Bear | Financiero, Gobierno | Threat Intel & Hunting |
| APT41 | Double Dragon | Financiero, Salud | Threat Intel & Hunting |
| Lazarus | Hidden Cobra | Banca (SWIFT) | Ciberseguridad Bancaria |
| FIN7 | Carbanak | Retail, Banca | Ciberseguridad Bancaria |
| Scattered Spider | — | Telecomunicaciones, Financiero | Red Team Ops |

---

## Herramientas del repo vs MITRE

```
nmap          → T1595, T1046, T1592
nuclei        → T1595.002, T1190
subfinder     → T1590.001
httpx         → T1595.001
frida         → T1575, T1411
objection     → T1409, T1439
mitmproxy     → T1557, T1439
jadx/apktool  → T1458
hashcat       → T1110.002
bettercap     → T1557, T1040
tcpdump       → T1040
```

---

## Referencias

- [MITRE ATT&CK Enterprise Matrix](https://attack.mitre.org/matrices/enterprise/)
- [MITRE ATT&CK Mobile Matrix](https://attack.mitre.org/matrices/mobile/)
- [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) — visualización interactiva
- [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team) — tests por TTP
- [MITRE D3FEND](https://d3fend.mitre.org/) — contramédidas defensivas
