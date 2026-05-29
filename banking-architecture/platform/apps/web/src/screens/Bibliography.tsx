import { useState } from "react"
import { ArrowLeft, Copy, Download, ExternalLink } from "lucide-react"
import SessionBadge from "@/components/SessionBadge"
import { useStore } from "@/store/useStore"
import type { Session } from "@/types"

type FilterId = "all" | "s1" | "s2" | "s3" | "s4"

interface Props {
  sessions: Session[]
}

export default function Bibliography({ sessions }: Props) {
  const navigate = useStore((s) => s.navigate)
  const [filter, setFilter] = useState<FilterId>("all")

  const visible = filter === "all" ? sessions : sessions.filter((s) => s.id === filter)

  const allRefs = sessions.flatMap((s) => s.pitch.references)

  const copyAll = () => {
    const text = sessions
      .map((s) => `── Sesión ${s.number}: ${s.title} ──\n` + s.pitch.references.join("\n"))
      .join("\n\n")
    navigator.clipboard.writeText(text)
  }

  const exportTxt = () => {
    const text = sessions
      .map((s) => `SESSION ${s.number}: ${s.title}\n${"=".repeat(60)}\n` + s.pitch.references.join("\n"))
      .join("\n\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bibliografia_ciberseguridad_2026.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const FILTERS: { id: FilterId; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "s1", label: "S1" },
    { id: "s2", label: "S2" },
    { id: "s3", label: "S3" },
    { id: "s4", label: "S4" },
  ]

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("course")}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Curso
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-mono font-bold text-2xl text-slate-100">Bibliografía Completa</h1>
            <p className="text-slate-400 text-sm mt-1">
              {allRefs.length} referencias · Ordenadas por sesión
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-surface border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
            >
              <Copy size={12} /> Copiar APA
            </button>
            <button
              onClick={exportTxt}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-surface border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
            >
              <Download size={12} /> .txt
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-surface border border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-10">
          {visible.map((session) => (
            <section key={session.id}>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/60">
                <SessionBadge session={session} size="sm" />
                <div>
                  <h2 className="font-semibold text-slate-100">{session.title}</h2>
                  <p className="text-xs text-slate-500">{session.dateLabel}</p>
                </div>
                <span className="ml-auto text-xs text-slate-500">
                  {session.pitch.references.length} refs
                </span>
              </div>

              <ol className="space-y-2">
                {session.pitch.references.map((ref, i) => (
                  <li key={i} className="flex gap-3 group">
                    <span className="font-mono text-xs text-slate-600 flex-shrink-0 w-5 mt-0.5 text-right">{i + 1}.</span>
                    <span className="text-sm text-slate-300 leading-relaxed flex-1">{ref}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(ref)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-300 p-0.5 flex-shrink-0"
                      title="Copiar"
                    >
                      <Copy size={12} />
                    </button>
                  </li>
                ))}
              </ol>

              <div className="mt-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Lecturas asignadas</p>
                <div className="space-y-1">
                  {session.readings.assigned.map((r) => (
                    <div key={r.title} className="flex items-center gap-2 text-sm">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                      >
                        {r.title} <ExternalLink size={11} className="opacity-60" />
                      </a>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-500 text-xs">{r.author}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
