# OSINT Automation Labs

Reconocimiento pasivo y activo automatizado: recolección de subdominios, emails, IPs, tecnologías y personas usando herramientas open source encadenadas en pipelines.

---

## Arquitectura del Entorno

```
┌─────────────────────────────────────────────────────────────────┐
│  Host                                                           │
│                                                                 │
│  http://localhost:5009  ──► SpiderFoot   (OSINT automatizado)   │
│                                                                 │
│  docker compose run --rm osint-tools bash                       │
│    └── theHarvester · subfinder · amass · httpx                 │
│    └── nuclei · shodan CLI · recon-ng · whois                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Inicio Rápido

```bash
cd labs/osint
./containers/setup.sh

# Entrar al container con todas las herramientas
docker compose -f containers/docker-compose.yml run --rm osint-tools bash

# Pipeline automatizado (desde el host)
./lab05-pipeline/osint-pipeline.sh ejemplo.com
```

---

## Labs

| Lab | Tema | Herramientas | Dificultad |
|-----|------|-------------|-----------|
| [Lab 01](lab01-passive-recon/) | Recon pasivo: DNS, WHOIS, Google | whois, dig, dorks | Principiante |
| [Lab 02](lab02-harvesting/) | Subdominios y emails | theHarvester, subfinder, amass | Principiante |
| [Lab 03](lab03-shodan/) | Shodan & Attack Surface | shodan CLI, nuclei | Intermedio |
| [Lab 04](lab04-people/) | People OSINT | recon-ng, SpiderFoot | Intermedio |
| [Lab 05](lab05-pipeline/) | Pipeline automatizado | todos encadenados | Avanzado |

---

## Importante — Uso ético

Todo el reconocimiento debe realizarse sobre:
- Dominios propios o de prueba (ej. `scanme.nmap.org`)
- Objetivos con autorización explícita por escrito
- Entornos de bug bounty dentro del scope definido

El OSINT pasivo (sin interacción directa) es generalmente legal, pero verificar las leyes locales.

---

## Referencias

- [OSINT Framework](https://osintframework.com/)
- [theHarvester](https://github.com/laramies/theHarvester)
- [Subfinder](https://github.com/projectdiscovery/subfinder)
- [Amass](https://github.com/owasp-amass/amass)
- [SpiderFoot](https://github.com/smicallef/spiderfoot)
- [Shodan](https://shodan.io)
