import { useState } from "react"
import { ChevronDown, ChevronUp, Copy, MessageSquare } from "lucide-react"
import StatCard from "@/components/StatCard"
import CaseCard from "@/components/CaseCard"
import type { Session } from "@/types"

interface Props {
  session: Session
}

export default function PitchPanel({ session }: Props) {
  const [refsOpen, setRefsOpen] = useState(false)
  const { pitch, color } = session

  const copyRefs = () => navigator.clipboard.writeText(pitch.references.join("\n"))

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="font-mono font-bold text-2xl leading-tight" style={{ color }}>
          {pitch.headline}
        </h2>
        <p className="text-slate-400 mt-1">{pitch.subheadline}</p>
      </div>

      <blockquote
        className="border-l-4 pl-4 py-2 text-base text-slate-300 italic leading-relaxed"
        style={{ borderLeftColor: color }}
      >
        {pitch.openingHook}
      </blockquote>

      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Estadísticas clave</h3>
        <div className="grid grid-cols-2 gap-3">
          {pitch.keyStats.map((s, i) => (
            <StatCard key={i} value={s.value} label={s.label} source={s.source} color={color} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Casos de referencia</h3>
        <div className="space-y-3">
          {pitch.keyCases.map((c, i) => (
            <CaseCard key={i} kcase={c} accentColor={color} />
          ))}
        </div>
      </div>

      <div
        className="rounded-xl p-4 flex gap-3"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}40` }}
      >
        <MessageSquare size={18} style={{ color }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color }}>
            Pregunta de reflexión
          </p>
          <p className="text-sm text-slate-200 leading-relaxed">{pitch.reflectionQuestion}</p>
        </div>
      </div>

      <div>
        <button
          onClick={() => setRefsOpen((v) => !v)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          {refsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Referencias ({pitch.references.length})
        </button>

        {refsOpen && (
          <div className="mt-3 space-y-1 animate-block-expand overflow-hidden">
            <ol className="space-y-1">
              {pitch.references.map((ref, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-400">
                  <span className="font-mono text-slate-600 flex-shrink-0">{i + 1}.</span>
                  {ref}
                </li>
              ))}
            </ol>
            <button
              onClick={copyRefs}
              className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Copy size={12} /> Copiar todas (APA)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
