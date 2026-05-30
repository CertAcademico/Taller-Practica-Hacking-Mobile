import { useState, useId } from "react"
import {
  GraduationCap, ChevronLeft, Plus, Trash2, Download,
  FileText, AlertTriangle, Shield, Info, ChevronDown, ChevronUp,
  Eye, Edit3, CheckCircle,
} from "lucide-react"
import { useStore } from "@/store/useStore"
import type { Finding, FindingSeverity, FindingStatus, Engagement } from "@/types"

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<FindingSeverity, { label: string; color: string; bg: string; border: string; order: number }> = {
  critical:      { label: "Crítica",       color: "#E53E3E", bg: "bg-red-900/40",    border: "border-red-700/50",    order: 0 },
  high:          { label: "Alta",          color: "#DD6B20", bg: "bg-orange-900/40", border: "border-orange-700/50", order: 1 },
  medium:        { label: "Media",         color: "#D69E2E", bg: "bg-yellow-900/40", border: "border-yellow-700/50", order: 2 },
  low:           { label: "Baja",          color: "#38A169", bg: "bg-green-900/40",  border: "border-green-700/50",  order: 3 },
  informational: { label: "Informativa",   color: "#3182CE", bg: "bg-blue-900/40",   border: "border-blue-700/50",   order: 4 },
}

const STATUS_CONFIG: Record<FindingStatus, { label: string; className: string }> = {
  "open":          { label: "Abierto",          className: "bg-red-900/50 text-red-300 border-red-700/40" },
  "in-progress":   { label: "En progreso",      className: "bg-yellow-900/50 text-yellow-300 border-yellow-700/40" },
  "remediated":    { label: "Remediado",        className: "bg-green-900/50 text-green-300 border-green-700/40" },
  "accepted-risk": { label: "Riesgo aceptado",  className: "bg-slate-700/50 text-slate-400 border-slate-600/40" },
}

const BLANK_FINDING = (): Omit<Finding, "id"> => ({
  title: "",
  severity: "high",
  status: "open",
  cvss: "",
  cve: "",
  ttp: "",
  owasp: "",
  affectedSystems: "",
  description: "",
  impact: "",
  evidence: "",
  remediation: "",
  references: "",
})

const BLANK_ENGAGEMENT = (): Engagement => ({
  id: crypto.randomUUID(),
  title: "",
  client: "",
  tester: "",
  startDate: "",
  endDate: "",
  scope: "",
  methodology: "OWASP Testing Guide v4.2 · PTES · MITRE ATT&CK",
  executiveSummary: "",
  findings: [],
})

// ─── Severity Badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  const cfg = SEVERITY_CONFIG[severity]
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cfg.bg} ${cfg.border}`}
      style={{ color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Finding Form ─────────────────────────────────────────────────────────────

function FindingForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Finding>
  onSave: (f: Omit<Finding, "id">) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Omit<Finding, "id">>({ ...BLANK_FINDING(), ...initial })
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const inputCls = "w-full bg-base border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500"
  const labelCls = "block text-xs font-medium text-slate-400 mb-1"
  const textareaCls = inputCls + " resize-none"

  return (
    <div className="space-y-4 p-5 bg-elevated rounded-2xl border border-slate-700/60">
      <h3 className="font-semibold text-slate-200 text-sm">
        {initial?.title ? "Editar hallazgo" : "Nuevo hallazgo"}
      </h3>

      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Título *</label>
          <input className={inputCls} placeholder="SQL Injection en /login" value={form.title}
            onChange={e => set("title", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Severidad *</label>
          <select className={inputCls} value={form.severity}
            onChange={e => set("severity", e.target.value as FindingSeverity)}>
            {(Object.keys(SEVERITY_CONFIG) as FindingSeverity[]).map(s => (
              <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>CVSS</label>
          <input className={inputCls} placeholder="9.8" value={form.cvss}
            onChange={e => set("cvss", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>CVE</label>
          <input className={inputCls} placeholder="CVE-2021-44228" value={form.cve}
            onChange={e => set("cve", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>MITRE TTP</label>
          <input className={inputCls} placeholder="T1190" value={form.ttp}
            onChange={e => set("ttp", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>OWASP</label>
          <input className={inputCls} placeholder="A03:2021" value={form.owasp}
            onChange={e => set("owasp", e.target.value)} />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Sistemas afectados *</label>
          <input className={inputCls} placeholder="https://app.cliente.com/login" value={form.affectedSystems}
            onChange={e => set("affectedSystems", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <select className={inputCls} value={form.status}
            onChange={e => set("status", e.target.value as FindingStatus)}>
            {(Object.keys(STATUS_CONFIG) as FindingStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Textareas */}
      {([
        ["description", "Descripción *", "Explica qué es la vulnerabilidad y dónde se encontró..."],
        ["impact",      "Impacto",        "Consecuencias de explotación exitosa..."],
        ["evidence",    "Evidencia",      "Request/response, capturas, payload utilizado..."],
        ["remediation", "Remediación *",  "Pasos específicos para corregir la vulnerabilidad..."],
        ["references",  "Referencias",    "https://owasp.org/..."],
      ] as [keyof typeof form, string, string][]).map(([key, lbl, ph]) => (
        <div key={key}>
          <label className={labelCls}>{lbl}</label>
          <textarea className={textareaCls} rows={3} placeholder={ph}
            value={form[key] as string}
            onChange={e => set(key, e.target.value)} />
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => { if (form.title && form.description && form.remediation) onSave(form) }}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          Guardar hallazgo
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-elevated border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Finding Card ─────────────────────────────────────────────────────────────

function FindingCard({
  finding,
  index,
  onEdit,
  onDelete,
}: {
  finding: Finding
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const cfg = SEVERITY_CONFIG[finding.severity]
  const statusCfg = STATUS_CONFIG[finding.status]

  return (
    <div className={`rounded-xl border bg-surface overflow-hidden ${cfg.border}`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-elevated/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-mono text-slate-600 w-5 text-center">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-200 text-sm truncate">{finding.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{finding.affectedSystems}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {finding.cvss && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-elevated text-slate-400">
              CVSS {finding.cvss}
            </span>
          )}
          <SeverityBadge severity={finding.severity} />
          <span className={`text-xs px-2 py-0.5 rounded border ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
          <button onClick={e => { e.stopPropagation(); onEdit() }}
            className="p-1 text-slate-600 hover:text-slate-300 transition-colors">
            <Edit3 size={13} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 text-slate-600 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
          {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
          <div className="flex flex-wrap gap-2">
            {finding.ttp   && <span className="text-xs px-2 py-0.5 rounded bg-elevated text-slate-400 font-mono">MITRE {finding.ttp}</span>}
            {finding.owasp && <span className="text-xs px-2 py-0.5 rounded bg-elevated text-slate-400 font-mono">{finding.owasp}</span>}
            {finding.cve   && <span className="text-xs px-2 py-0.5 rounded bg-elevated text-slate-400 font-mono">{finding.cve}</span>}
          </div>
          {[
            ["Descripción", finding.description],
            ["Impacto",     finding.impact],
            ["Evidencia",   finding.evidence],
            ["Remediación", finding.remediation],
            ["Referencias", finding.references],
          ].filter(([,v]) => v).map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{value}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Report Preview ───────────────────────────────────────────────────────────

function generateMarkdown(eng: Engagement): string {
  const sorted = [...eng.findings].sort(
    (a, b) => SEVERITY_CONFIG[a.severity].order - SEVERITY_CONFIG[b.severity].order
  )

  const counts = {
    critical: sorted.filter(f => f.severity === "critical").length,
    high:     sorted.filter(f => f.severity === "high").length,
    medium:   sorted.filter(f => f.severity === "medium").length,
    low:      sorted.filter(f => f.severity === "low").length,
    info:     sorted.filter(f => f.severity === "informational").length,
  }

  const lines: string[] = [
    `# Reporte de Penetration Testing`,
    `## ${eng.title || "Engagement sin título"}`,
    ``,
    `---`,
    ``,
    `| Campo | Detalle |`,
    `|-------|---------|`,
    `| Cliente | ${eng.client || "—"} |`,
    `| Tester | ${eng.tester || "—"} |`,
    `| Período | ${eng.startDate || "—"} — ${eng.endDate || "—"} |`,
    `| Metodología | ${eng.methodology} |`,
    ``,
    `---`,
    ``,
    `## Resumen Ejecutivo`,
    ``,
    eng.executiveSummary || "_Sin resumen ejecutivo._",
    ``,
    `### Distribución de hallazgos`,
    ``,
    `| Severidad | Cantidad |`,
    `|-----------|---------|`,
    `| 🔴 Crítica | ${counts.critical} |`,
    `| 🟠 Alta | ${counts.high} |`,
    `| 🟡 Media | ${counts.medium} |`,
    `| 🟢 Baja | ${counts.low} |`,
    `| 🔵 Informativa | ${counts.info} |`,
    `| **Total** | **${sorted.length}** |`,
    ``,
    `---`,
    ``,
    `## Alcance`,
    ``,
    eng.scope || "_Sin alcance definido._",
    ``,
    `---`,
    ``,
    `## Tabla de Hallazgos`,
    ``,
    `| # | Título | Severidad | CVSS | Sistema afectado | Estado |`,
    `|---|--------|-----------|------|-----------------|--------|`,
    ...sorted.map((f, i) =>
      `| ${i + 1} | ${f.title} | ${SEVERITY_CONFIG[f.severity].label} | ${f.cvss || "—"} | ${f.affectedSystems} | ${STATUS_CONFIG[f.status].label} |`
    ),
    ``,
    `---`,
    ``,
    `## Hallazgos Detallados`,
    ``,
    ...sorted.flatMap((f, i) => [
      `### ${i + 1}. ${f.title}`,
      ``,
      `| Campo | Valor |`,
      `|-------|-------|`,
      `| **Severidad** | ${SEVERITY_CONFIG[f.severity].label} |`,
      `| **CVSS** | ${f.cvss || "—"} |`,
      ...(f.cve   ? [`| **CVE** | ${f.cve} |`] : []),
      ...(f.ttp   ? [`| **MITRE TTP** | ${f.ttp} |`] : []),
      ...(f.owasp ? [`| **OWASP** | ${f.owasp} |`] : []),
      `| **Sistema afectado** | ${f.affectedSystems} |`,
      `| **Estado** | ${STATUS_CONFIG[f.status].label} |`,
      ``,
      `#### Descripción`,
      f.description,
      ``,
      ...(f.impact ? [`#### Impacto`, f.impact, ``] : []),
      ...(f.evidence ? [
        `#### Evidencia`,
        `\`\`\``,
        f.evidence,
        `\`\`\``,
        ``,
      ] : []),
      `#### Remediación`,
      f.remediation,
      ``,
      ...(f.references ? [`#### Referencias`, f.references, ``] : []),
      `---`,
      ``,
    ]),
    ``,
    `_Reporte generado por LabThinkTank Reporting Engine · ${new Date().toISOString().slice(0, 10)}_`,
  ]

  return lines.join("\n")
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReportGenerator() {
  const navigate = useStore(s => s.navigate)

  const [engagement, setEngagement] = useState<Engagement>(BLANK_ENGAGEMENT)
  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [tab, setTab]                 = useState<"editor" | "preview">("editor")

  const setEng = (k: keyof Engagement, v: string) =>
    setEngagement(p => ({ ...p, [k]: v }))

  const addFinding = (f: Omit<Finding, "id">) => {
    const id = crypto.randomUUID()
    if (editingId) {
      setEngagement(p => ({
        ...p,
        findings: p.findings.map(x => x.id === editingId ? { ...f, id: editingId } : x),
      }))
      setEditingId(null)
    } else {
      setEngagement(p => ({ ...p, findings: [...p.findings, { ...f, id }] }))
    }
    setShowForm(false)
  }

  const deleteFinding = (id: string) =>
    setEngagement(p => ({ ...p, findings: p.findings.filter(f => f.id !== id) }))

  const downloadMarkdown = () => {
    const md = generateMarkdown(engagement)
    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pentest-report-${engagement.client || "draft"}-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(engagement, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pentest-${engagement.client || "draft"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sorted = [...engagement.findings].sort(
    (a, b) => SEVERITY_CONFIG[a.severity].order - SEVERITY_CONFIG[b.severity].order
  )

  const counts = {
    critical: sorted.filter(f => f.severity === "critical").length,
    high:     sorted.filter(f => f.severity === "high").length,
    medium:   sorted.filter(f => f.severity === "medium").length,
    low:      sorted.filter(f => f.severity === "low").length,
    info:     sorted.filter(f => f.severity === "informational").length,
  }

  const inputCls = "w-full bg-base border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500"
  const labelCls = "block text-xs font-medium text-slate-400 mb-1"

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
              <p className="text-xs text-slate-500 leading-none">LabThinkTank · Reporting Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab toggle */}
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              {(["editor", "preview"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                    tab === t ? "bg-elevated text-slate-200" : "text-slate-500 hover:text-slate-300"
                  }`}>
                  {t === "editor" ? <Edit3 size={12} /> : <Eye size={12} />}
                  {t === "editor" ? "Editor" : "Preview"}
                </button>
              ))}
            </div>
            <button onClick={downloadMarkdown}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
              <Download size={13} />
              .md
            </button>
            <button onClick={downloadJSON}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-elevated border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
              <Download size={13} />
              .json
            </button>
            <button onClick={() => navigate("home")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-elevated border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronLeft size={13} />
              Inicio
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {tab === "editor" ? (
          <div className="space-y-8">

            {/* Engagement Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-400" />
                <h2 className="font-semibold text-slate-200">Información del Engagement</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-surface rounded-2xl border border-slate-700/60 p-5">
                {([
                  ["title",       "Título del reporte",  "Pentest Aplicación Web — Cliente SA"],
                  ["client",      "Cliente",             "Empresa Cliente SA"],
                  ["tester",      "Tester / Equipo",     "Emanuel Ortiz R."],
                  ["startDate",   "Fecha inicio",        "2026-07-01"],
                  ["endDate",     "Fecha fin",           "2026-07-15"],
                  ["methodology", "Metodología",         "OWASP · PTES · MITRE ATT&CK"],
                ] as [keyof Engagement, string, string][]).map(([key, label, ph]) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input className={inputCls} placeholder={ph}
                      value={engagement[key] as string}
                      onChange={e => setEng(key, e.target.value)} />
                  </div>
                ))}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Alcance</label>
                  <textarea className={inputCls + " resize-none"} rows={2}
                    placeholder="https://app.cliente.com, https://api.cliente.com — excluye sistemas de terceros"
                    value={engagement.scope}
                    onChange={e => setEng("scope", e.target.value)} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Resumen ejecutivo</label>
                  <textarea className={inputCls + " resize-none"} rows={4}
                    placeholder="Durante el período de evaluación se identificaron N hallazgos..."
                    value={engagement.executiveSummary}
                    onChange={e => setEng("executiveSummary", e.target.value)} />
                </div>
              </div>
            </section>

            {/* Findings */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-400" />
                  <h2 className="font-semibold text-slate-200">Hallazgos</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-elevated text-slate-400">
                    {engagement.findings.length}
                  </span>
                </div>
                {!showForm && (
                  <button onClick={() => { setShowForm(true); setEditingId(null) }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                    <Plus size={13} />
                    Agregar hallazgo
                  </button>
                )}
              </div>

              {/* Resumen de severidades */}
              {engagement.findings.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(SEVERITY_CONFIG) as [FindingSeverity, typeof SEVERITY_CONFIG[FindingSeverity]][])
                    .map(([sev, cfg]) => {
                      const n = engagement.findings.filter(f => f.severity === sev).length
                      if (!n) return null
                      return (
                        <div key={sev} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                          <span className="text-xs font-bold" style={{ color: cfg.color }}>{n}</span>
                          <span className="text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                      )
                    })}
                </div>
              )}

              {/* Form */}
              {showForm && (
                <FindingForm
                  initial={editingId ? engagement.findings.find(f => f.id === editingId) : undefined}
                  onSave={addFinding}
                  onCancel={() => { setShowForm(false); setEditingId(null) }}
                />
              )}

              {/* Lista de hallazgos */}
              {sorted.length > 0 ? (
                <div className="space-y-2">
                  {sorted.map((f, i) => (
                    <FindingCard
                      key={f.id}
                      finding={f}
                      index={i}
                      onEdit={() => { setEditingId(f.id); setShowForm(true) }}
                      onDelete={() => deleteFinding(f.id)}
                    />
                  ))}
                </div>
              ) : !showForm && (
                <div className="rounded-2xl border border-slate-700/40 border-dashed p-10 text-center">
                  <Shield size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No hay hallazgos. Agrega el primero.</p>
                </div>
              )}
            </section>
          </div>

        ) : (
          /* Preview mode */
          <div className="bg-surface rounded-2xl border border-slate-700/60 p-8">
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed overflow-auto">
              {generateMarkdown(engagement)}
            </pre>
          </div>
        )}
      </main>
    </div>
  )
}
