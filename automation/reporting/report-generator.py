#!/usr/bin/env python3
"""
report-generator.py — LabThinkTank Pentest Report Generator
Genera reportes en Markdown y HTML desde un JSON de engagement.

Uso:
    python3 report-generator.py engagement.json
    python3 report-generator.py engagement.json --format html
    python3 report-generator.py --template > nuevo_engagement.json
"""

import sys
import json
import argparse
from datetime import date
from pathlib import Path

# ─── Constantes ───────────────────────────────────────────────────────────────

SEVERITY_ORDER  = {"critical": 0, "high": 1, "medium": 2, "low": 3, "informational": 4}
SEVERITY_LABELS = {
    "critical":      "🔴 Crítica",
    "high":          "🟠 Alta",
    "medium":        "🟡 Media",
    "low":           "🟢 Baja",
    "informational": "🔵 Informativa",
}
STATUS_LABELS = {
    "open":          "Abierto",
    "in-progress":   "En progreso",
    "remediated":    "Remediado",
    "accepted-risk": "Riesgo aceptado",
}

BLANK_TEMPLATE = {
    "id": "engagement-001",
    "title": "Pentest Aplicación Web",
    "client": "Cliente SA",
    "tester": "Emanuel Ortiz R.",
    "startDate": str(date.today()),
    "endDate": str(date.today()),
    "scope": "https://app.cliente.com, https://api.cliente.com",
    "methodology": "OWASP Testing Guide v4.2 · PTES · MITRE ATT&CK",
    "executiveSummary": "Durante el período de evaluación se identificaron N hallazgos...",
    "findings": [
        {
            "id": "f-001",
            "title": "SQL Injection en endpoint de login",
            "severity": "critical",
            "status": "open",
            "cvss": "9.8",
            "cve": "",
            "ttp": "T1190",
            "owasp": "A03:2021",
            "affectedSystems": "https://app.cliente.com/api/auth/login",
            "description": "Se identificó una vulnerabilidad de inyección SQL en el parámetro 'username' del endpoint de autenticación. La aplicación concatena directamente la entrada del usuario en la query SQL sin sanitización.",
            "impact": "Un atacante podría bypassear la autenticación, extraer todos los datos de usuarios (incluyendo contraseñas hasheadas) y en algunos casos ejecutar comandos en el servidor de base de datos.",
            "evidence": "POST /api/auth/login HTTP/1.1\nContent-Type: application/json\n\n{\"username\":\"' OR '1'='1'--\",\"password\":\"x\"}\n\nRespuesta: HTTP/1.1 200 OK\n{\"token\":\"eyJ...\",\"user\":{\"id\":1,\"role\":\"admin\"}}",
            "remediation": "1. Usar prepared statements / parameterized queries en todas las consultas SQL.\n2. Implementar validación y sanitización de entradas en el servidor.\n3. Aplicar el principio de mínimo privilegio al usuario de base de datos.",
            "references": "https://owasp.org/www-community/attacks/SQL_Injection\nhttps://portswigger.net/web-security/sql-injection"
        }
    ]
}

# ─── Generación Markdown ───────────────────────────────────────────────────────

def generate_markdown(eng: dict) -> str:
    findings = sorted(
        eng.get("findings", []),
        key=lambda f: SEVERITY_ORDER.get(f.get("severity", "low"), 99)
    )

    counts = {s: sum(1 for f in findings if f.get("severity") == s) for s in SEVERITY_ORDER}
    total  = len(findings)

    lines = [
        f"# Reporte de Penetration Testing",
        f"## {eng.get('title', 'Engagement')}",
        "",
        "---",
        "",
        "| Campo | Detalle |",
        "|-------|---------|",
        f"| **Cliente** | {eng.get('client', '—')} |",
        f"| **Tester** | {eng.get('tester', '—')} |",
        f"| **Período** | {eng.get('startDate', '—')} — {eng.get('endDate', '—')} |",
        f"| **Metodología** | {eng.get('methodology', '—')} |",
        "",
        "---",
        "",
        "## Resumen Ejecutivo",
        "",
        eng.get("executiveSummary") or "_Sin resumen ejecutivo._",
        "",
        "### Distribución de hallazgos",
        "",
        "| Severidad | Cantidad |",
        "|-----------|---------|",
        f"| {SEVERITY_LABELS['critical']} | {counts['critical']} |",
        f"| {SEVERITY_LABELS['high']} | {counts['high']} |",
        f"| {SEVERITY_LABELS['medium']} | {counts['medium']} |",
        f"| {SEVERITY_LABELS['low']} | {counts['low']} |",
        f"| {SEVERITY_LABELS['informational']} | {counts['informational']} |",
        f"| **Total** | **{total}** |",
        "",
        "---",
        "",
        "## Alcance",
        "",
        eng.get("scope") or "_Sin alcance definido._",
        "",
        "---",
        "",
        "## Tabla de Hallazgos",
        "",
        "| # | Título | Severidad | CVSS | Sistema afectado | Estado |",
        "|---|--------|-----------|------|-----------------|--------|",
    ]

    for i, f in enumerate(findings, 1):
        sev   = SEVERITY_LABELS.get(f.get("severity", "low"), f.get("severity", "—"))
        cvss  = f.get("cvss") or "—"
        sys_  = f.get("affectedSystems", "—")
        st    = STATUS_LABELS.get(f.get("status", "open"), "—")
        lines.append(f"| {i} | {f.get('title','—')} | {sev} | {cvss} | {sys_} | {st} |")

    lines += ["", "---", "", "## Hallazgos Detallados", ""]

    for i, f in enumerate(findings, 1):
        sev = SEVERITY_LABELS.get(f.get("severity","low"), f.get("severity","—"))
        lines += [
            f"### {i}. {f.get('title','Sin título')}",
            "",
            "| Campo | Valor |",
            "|-------|-------|",
            f"| **Severidad** | {sev} |",
            f"| **CVSS** | {f.get('cvss') or '—'} |",
        ]
        if f.get("cve"):
            lines.append(f"| **CVE** | {f['cve']} |")
        if f.get("ttp"):
            lines.append(f"| **MITRE TTP** | {f['ttp']} |")
        if f.get("owasp"):
            lines.append(f"| **OWASP** | {f['owasp']} |")
        lines += [
            f"| **Sistema afectado** | {f.get('affectedSystems','—')} |",
            f"| **Estado** | {STATUS_LABELS.get(f.get('status','open'),'—')} |",
            "",
            "#### Descripción",
            f.get("description") or "_Sin descripción._",
            "",
        ]
        if f.get("impact"):
            lines += ["#### Impacto", f["impact"], ""]
        if f.get("evidence"):
            lines += ["#### Evidencia", "```", f["evidence"], "```", ""]
        if f.get("remediation"):
            lines += ["#### Remediación", f["remediation"], ""]
        if f.get("references"):
            lines += ["#### Referencias", f["references"], ""]
        lines += ["---", ""]

    lines += [
        "",
        f"_Reporte generado por LabThinkTank Reporting Engine · {date.today()}_",
    ]

    return "\n".join(lines)

# ─── Generación HTML ───────────────────────────────────────────────────────────

def generate_html(eng: dict) -> str:
    md = generate_markdown(eng)
    try:
        import markdown
        body = markdown.markdown(md, extensions=["tables", "fenced_code"])
    except ImportError:
        body = f"<pre>{md}</pre>"

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>{eng.get('title','Pentest Report')}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         max-width: 900px; margin: 40px auto; padding: 0 20px;
         color: #1a202c; line-height: 1.6; }}
  h1 {{ color: #2d3748; border-bottom: 3px solid #e53e3e; padding-bottom: 8px; }}
  h2 {{ color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }}
  h3 {{ color: #4a5568; }}
  table {{ border-collapse: collapse; width: 100%; margin: 16px 0; }}
  th, td {{ border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }}
  th {{ background: #f7fafc; font-weight: 600; }}
  tr:nth-child(even) {{ background: #f7fafc; }}
  code, pre {{ background: #2d3748; color: #e2e8f0; padding: 2px 6px;
               border-radius: 4px; font-family: 'Courier New', monospace; }}
  pre {{ padding: 16px; overflow-x: auto; }}
  pre code {{ background: none; padding: 0; }}
  hr {{ border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }}
  @media print {{ body {{ max-width: 100%; margin: 0; padding: 20px; }} }}
</style>
</head>
<body>
{body}
</body>
</html>"""

# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="LabThinkTank Pentest Report Generator"
    )
    parser.add_argument("input", nargs="?", help="JSON de engagement")
    parser.add_argument("--format", choices=["md", "html"], default="md",
                        help="Formato de salida (default: md)")
    parser.add_argument("--output", "-o", help="Archivo de salida (default: stdout)")
    parser.add_argument("--template", action="store_true",
                        help="Mostrar template JSON vacío")
    args = parser.parse_args()

    if args.template:
        print(json.dumps(BLANK_TEMPLATE, indent=2, ensure_ascii=False))
        return

    if not args.input:
        parser.print_help()
        sys.exit(1)

    with open(args.input, encoding="utf-8") as f:
        engagement = json.load(f)

    if args.format == "html":
        content = generate_html(engagement)
        ext = ".html"
    else:
        content = generate_markdown(engagement)
        ext = ".md"

    if args.output:
        Path(args.output).write_text(content, encoding="utf-8")
        print(f"[+] Reporte generado: {args.output}", file=sys.stderr)
    else:
        out = args.input.replace(".json", ext)
        Path(out).write_text(content, encoding="utf-8")
        print(f"[+] Reporte generado: {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
