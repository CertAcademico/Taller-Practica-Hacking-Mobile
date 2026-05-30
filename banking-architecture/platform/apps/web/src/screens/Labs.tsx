import { useState } from "react"
import {
  Terminal, Wifi, Code2, Smartphone, Target, Boxes, Globe, Search, Network, Cloud,
  GraduationCap, ChevronLeft, Copy, Check, ExternalLink,
  Container, Play, type LucideIcon,
} from "lucide-react"
import { useStore } from "@/store/useStore"

// ─── Data ─────────────────────────────────────────────────────────────────────

type LabStatus = "available" | "in-progress" | "planned"
type LabDifficulty = "Principiante" | "Intermedio" | "Avanzado" | "Varios"

interface DockerService {
  name: string
  url: string
  description: string
}

interface LabModule {
  id: string
  title: string
  shortTitle: string
  description: string
  icon: LucideIcon
  color: string
  status: LabStatus
  difficulty: LabDifficulty
  tools: string[]
  path: string
  quickStart: string
  docker?: DockerService[]
  labCount?: number
}

const LABS: LabModule[] = [
  {
    id: "linux-cli",
    title: "Linux CLI",
    shortTitle: "Linux CLI",
    description: "Fundamentos de la línea de comandos Linux: navegación, permisos, procesos, redirecciones y pipes.",
    icon: Terminal,
    color: "#38A169",
    status: "available",
    difficulty: "Principiante",
    tools: ["bash", "grep", "awk", "sed", "find", "netstat"],
    path: "labs/linux-cli/",
    quickStart: "cd labs/linux-cli && cat README.md",
    labCount: 1,
  },
  {
    id: "redes",
    title: "Redes",
    shortTitle: "Redes",
    description: "Reconocimiento de redes, enumeración de servicios, herramientas de scanning y análisis de tráfico.",
    icon: Wifi,
    color: "#3182CE",
    status: "available",
    difficulty: "Principiante",
    tools: ["nmap", "nuclei", "rustscan", "bettercap", "wireshark"],
    path: "labs/redes/",
    quickStart: "cd labs/redes && cat README.md",
    labCount: 1,
  },
  {
    id: "bash-scripting",
    title: "Bash Scripting",
    shortTitle: "Bash",
    description: "Automatización ofensiva con bash: pipelines de recon, parsing de salidas y scripting de herramientas.",
    icon: Code2,
    color: "#D69E2E",
    status: "available",
    difficulty: "Principiante",
    tools: ["bash", "curl", "jq", "nmap", "recon.sh"],
    path: "labs/bash-scripting/",
    quickStart: "cd labs/bash-scripting && cat README.md",
    labCount: 1,
  },
  {
    id: "mobile",
    title: "Mobile Hacking",
    shortTitle: "Mobile",
    description: "Pentesting Android dockerizado: reversión de APKs, análisis dinámico con Frida, intercepción de tráfico y SSL Pinning bypass.",
    icon: Smartphone,
    color: "#805AD5",
    status: "available",
    difficulty: "Avanzado",
    tools: ["jadx", "apktool", "frida", "objection", "mitmproxy", "MobSF", "adb"],
    path: "labs/mobile/",
    quickStart: "cd labs/mobile && ./containers/mobile/scripts/setup.sh",
    labCount: 6,
    docker: [
      { name: "Android (noVNC)", url: "http://localhost:6080", description: "Emulador Android 11" },
      { name: "MobSF",           url: "http://localhost:8000", description: "Análisis estático / dinámico" },
      { name: "mitmproxy UI",    url: "http://localhost:8081", description: "Proxy de interceptación" },
    ],
  },
  {
    id: "cloud",
    title: "Cloud Security",
    shortTitle: "Cloud",
    description: "AWS misconfigurations, IAM privilege escalation, IMDS via SSRF, container escape en Kubernetes e IaC scanning con Checkov — sobre LocalStack dockerizado.",
    icon: Cloud,
    color: "#276749",
    status: "available",
    difficulty: "Avanzado",
    tools: ["aws-cli", "Pacu", "CloudFox", "Checkov", "truffleHog", "ScoutSuite", "kubectl"],
    path: "labs/cloud/",
    quickStart: "cd labs/cloud && ./containers/setup.sh",
    labCount: 6,
    docker: [
      { name: "LocalStack",  url: "http://localhost:4566", description: "AWS simulado — S3, IAM, Secrets, SSM" },
      { name: "SSRF App",    url: "http://localhost:8181", description: "App vulnerable para explotar IMDS" },
      { name: "IMDS Mock",   url: "http://localhost:8169", description: "169.254.169.254 simulado con credenciales IAM" },
    ],
  },
  {
    id: "active-directory",
    title: "Active Directory",
    shortTitle: "AD Pentesting",
    description: "Ruta completa de compromiso de un dominio Windows: enumeración LDAP, Kerberoasting, BloodHound attack paths, DCSync y Golden Ticket sobre Samba AD dockerizado.",
    icon: Network,
    color: "#C05621",
    status: "available",
    difficulty: "Avanzado",
    tools: ["impacket", "NetExec", "BloodHound", "Kerbrute", "Responder", "evil-winrm"],
    path: "labs/ad/",
    quickStart: "cd labs/ad && ./containers/setup.sh",
    labCount: 6,
    docker: [
      { name: "DC01 (Samba AD)", url: "ldap://192.168.100.10", description: "LABTHINKTANK.LOCAL — LDAP:389 SMB:445 Kerberos:88" },
      { name: "BloodHound CE",   url: "http://localhost:8080", description: "Attack path analysis" },
      { name: "Neo4j Browser",   url: "http://localhost:7474", description: "Grafo de relaciones AD" },
    ],
  },
  {
    id: "osint",
    title: "OSINT Automation",
    shortTitle: "OSINT",
    description: "Reconocimiento pasivo y activo: DNS, subdominios, emails, Shodan, people OSINT y pipeline automatizado que genera reportes Markdown.",
    icon: Search,
    color: "#2B6CB0",
    status: "available",
    difficulty: "Intermedio",
    tools: ["subfinder", "amass", "theHarvester", "httpx", "nuclei", "shodan", "SpiderFoot"],
    path: "labs/osint/",
    quickStart: "cd labs/osint && ./containers/setup.sh",
    labCount: 5,
    docker: [
      { name: "SpiderFoot", url: "http://localhost:5009", description: "OSINT automatizado con 200+ módulos" },
    ],
  },
  {
    id: "web",
    title: "Web Exploitation",
    shortTitle: "Web",
    description: "OWASP Top 10 en la práctica: SQLi, XSS, IDOR, File Upload, SSRF y Command Injection sobre DVWA, Juice Shop y WebGoat en entorno Docker.",
    icon: Globe,
    color: "#DD6B20",
    status: "available",
    difficulty: "Intermedio",
    tools: ["burpsuite", "sqlmap", "gobuster", "nikto", "DVWA", "Juice Shop", "WebGoat"],
    path: "labs/web/",
    quickStart: "cd labs/web && ./containers/setup.sh",
    labCount: 6,
    docker: [
      { name: "DVWA",       url: "http://localhost:8080", description: "PHP/MySQL — SQLi, XSS, File Upload, CMDi" },
      { name: "Juice Shop", url: "http://localhost:3000",  description: "Node.js — IDOR, XSS moderno, OWASP Top 10" },
      { name: "WebGoat",    url: "http://localhost:8888",  description: "Java/Spring — SSRF, A2-A10" },
    ],
  },
  {
    id: "tryhackme",
    title: "TryHackMe",
    shortTitle: "TryHackMe",
    description: "Writeups y notas de máquinas TryHackMe. Actualmente: Vulnversity (enumeración web, reverse shell, privesc).",
    icon: Target,
    color: "#E53E3E",
    status: "available",
    difficulty: "Varios",
    tools: ["nmap", "gobuster", "burpsuite", "netcat"],
    path: "labs/tryhackme/",
    quickStart: "cat labs/tryhackme/vulnversity.md",
    labCount: 1,
  },
  {
    id: "hackthebox",
    title: "HackTheBox",
    shortTitle: "HackTheBox",
    description: "Writeups de máquinas HackTheBox. Módulo en construcción.",
    icon: Boxes,
    color: "#9F7AEA",
    status: "planned",
    difficulty: "Varios",
    tools: ["nmap", "metasploit", "linpeas", "bloodhound"],
    path: "labs/hackthebox/",
    quickStart: "ls labs/hackthebox/",
    labCount: 0,
  },
]

const STATUS_CONFIG: Record<LabStatus, { label: string; className: string; dot: string }> = {
  "available":  { label: "Disponible",    className: "bg-green-900/60 text-green-300 border-green-700/40",  dot: "bg-green-400" },
  "in-progress":{ label: "En progreso",   className: "bg-blue-900/60  text-blue-300  border-blue-700/40",   dot: "bg-blue-400"  },
  "planned":    { label: "Planificado",   className: "bg-slate-700/60 text-slate-400 border-slate-600/40",  dot: "bg-slate-500" },
}

const DIFFICULTY_COLOR: Record<LabDifficulty, string> = {
  "Principiante": "#38A169",
  "Intermedio":   "#D69E2E",
  "Avanzado":     "#E53E3E",
  "Varios":       "#805AD5",
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <button
      onClick={copy}
      className="flex-shrink-0 p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
      title="Copiar"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}

// ─── Lab Card ─────────────────────────────────────────────────────────────────

function LabCard({ lab, onExpand }: { lab: LabModule; onExpand: (id: string) => void }) {
  const Icon = lab.icon
  const status = STATUS_CONFIG[lab.status]
  const isAvailable = lab.status !== "planned"

  return (
    <div
      onClick={() => isAvailable && onExpand(lab.id)}
      className={`group relative flex flex-col rounded-2xl border bg-surface overflow-hidden transition-all duration-200 ${
        isAvailable
          ? "cursor-pointer hover:border-slate-500 hover:shadow-xl hover:-translate-y-0.5"
          : "cursor-default opacity-60"
      }`}
      style={{ borderColor: isAvailable ? `${lab.color}40` : "#374151" }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: lab.color }} />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${lab.color}20` }}
          >
            <Icon size={20} style={{ color: lab.color }} />
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1.5 ${status.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${lab.status === "available" ? "animate-pulse" : ""}`} />
            {status.label}
          </span>
        </div>

        {/* Title & description */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-100">{lab.title}</h3>
            {lab.labCount !== undefined && lab.labCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-elevated text-slate-400 font-mono">
                {lab.labCount} lab{lab.labCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{lab.description}</p>
        </div>

        {/* Tools */}
        <div className="flex flex-wrap gap-1">
          {lab.tools.slice(0, 5).map((t) => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-elevated text-slate-400 font-mono">
              {t}
            </span>
          ))}
          {lab.tools.length > 5 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-elevated text-slate-500">
              +{lab.tools.length - 5}
            </span>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2 border-t border-slate-700/50"
        >
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: `${DIFFICULTY_COLOR[lab.difficulty]}15`,
              color: DIFFICULTY_COLOR[lab.difficulty],
            }}
          >
            {lab.difficulty}
          </span>
          {isAvailable && (
            <span className="text-xs text-slate-500 group-hover:text-slate-300 flex items-center gap-1 transition-colors">
              <Play size={11} />
              Abrir
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Lab Detail Panel ─────────────────────────────────────────────────────────

function LabDetail({ lab, onClose }: { lab: LabModule; onClose: () => void }) {
  const Icon = lab.icon

  return (
    <div className="rounded-2xl border bg-surface overflow-hidden" style={{ borderColor: `${lab.color}40` }}>
      <div className="h-1 w-full" style={{ backgroundColor: lab.color }} />

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${lab.color}20` }}
            >
              <Icon size={24} style={{ color: lab.color }} />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-lg">{lab.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{lab.path}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg bg-elevated border border-slate-700/50"
          >
            Cerrar
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{lab.description}</p>

        {/* Quick start */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Start</p>
          <div className="flex items-center gap-2 bg-base rounded-lg px-3 py-2.5 border border-slate-700/50 font-mono text-xs text-green-300">
            <span className="text-slate-600 select-none">$</span>
            <span className="flex-1 break-all">{lab.quickStart}</span>
            <CopyButton text={lab.quickStart} />
          </div>
        </div>

        {/* Docker services */}
        {lab.docker && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Container size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Servicios Docker</p>
            </div>
            <div className="space-y-2">
              {lab.docker.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between gap-3 rounded-lg bg-elevated px-3 py-2.5 border border-slate-700/50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{svc.name}</p>
                    <p className="text-xs text-slate-500">{svc.description}</p>
                  </div>
                  <a
                    href={svc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-blue-900/40 text-blue-300 border border-blue-700/40 hover:bg-blue-900/70 transition-colors font-mono whitespace-nowrap"
                  >
                    <ExternalLink size={11} />
                    {svc.url.replace("http://", "")}
                  </a>
                </div>
              ))}
              <div className="mt-2 rounded-lg bg-base px-3 py-2.5 border border-slate-700/40">
                <p className="text-xs text-slate-500 mb-1.5 font-semibold">Levantar entorno</p>
                <div className="flex items-center gap-2 font-mono text-xs text-green-300">
                  <span className="text-slate-600 select-none">$</span>
                  <span className="flex-1">docker compose -f labs/mobile/containers/mobile/docker-compose.yml up -d</span>
                  <CopyButton text="docker compose -f labs/mobile/containers/mobile/docker-compose.yml up -d" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tools */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Herramientas</p>
          <div className="flex flex-wrap gap-1.5">
            {lab.tools.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-lg bg-elevated text-slate-300 font-mono border border-slate-700/40">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Labs() {
  const navigate = useStore((s) => s.navigate)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const available = LABS.filter((l) => l.status !== "planned")
  const planned   = LABS.filter((l) => l.status === "planned")
  const expanded  = LABS.find((l) => l.id === expandedId) ?? null

  return (
    <div className="min-h-screen bg-base text-slate-100">
      {/* Nav */}
      <header className="border-b border-slate-700/60 bg-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-100 leading-tight">CERT Académico</p>
              <p className="text-xs text-slate-500 leading-none">LabThinkTank · Plataforma de Aprendizaje</p>
            </div>
          </div>
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg bg-elevated border border-slate-700/50"
          >
            <ChevronLeft size={13} />
            Cursos
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Hero */}
        <div className="space-y-3">
          <h1 className="font-mono font-bold text-3xl text-slate-100">
            Laboratorios
          </h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
            Entornos prácticos de ciberseguridad ofensiva. Labs hands-on con Docker, herramientas reales
            y apps vulnerables. Todos reproducibles en tu máquina local.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            {[
              { value: `${available.length}`,           label: "Disponibles" },
              { value: `${LABS.reduce((a, l) => a + (l.labCount ?? 0), 0)}`, label: "Labs totales" },
              { value: "Docker",                        label: "Entorno" },
              { value: "OWASP · MITRE",                 label: "Metodología" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 bg-elevated rounded-lg border border-slate-700/60">
                <span className="font-mono font-bold text-blue-400 text-sm">{s.value}</span>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {expanded && (
          <LabDetail lab={expanded} onClose={() => setExpandedId(null)} />
        )}

        {/* Available labs */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="font-semibold text-slate-200">Disponibles</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">
              {available.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                onExpand={(id) => setExpandedId(expandedId === id ? null : id)}
              />
            ))}
          </div>
        </section>

        {/* Planned */}
        {planned.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <h2 className="font-semibold text-slate-400">En construcción</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                {planned.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {planned.map((lab) => (
                <LabCard key={lab.id} lab={lab} onExpand={() => {}} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
