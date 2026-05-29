import { Copy, Video, HelpCircle } from "lucide-react"
import type { ExpertConference } from "@/types"

interface Props {
  expert: ExpertConference
  sessionColor: string
}

export default function ExpertCard({ expert, sessionColor }: Props) {
  const copy = (text: string) => navigator.clipboard.writeText(text)

  return (
    <div className="rounded-xl bg-elevated border border-green-800/40 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-green-900/30 border-b border-green-800/40">
        <Video size={16} className="text-green-400" />
        <span className="font-semibold text-green-300 text-sm">Conferencia de Experto</span>
        <span
          className="ml-auto font-mono text-xs px-2 py-0.5 rounded"
          style={{ backgroundColor: `${sessionColor}25`, color: sessionColor }}
        >
          {expert.slot}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Perfil sugerido</p>
          <p className="text-sm text-slate-300 leading-relaxed">{expert.profileDesc}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">📍 {expert.format}</span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={13} className="text-slate-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Preguntas guía</p>
          </div>
          <ol className="space-y-2">
            {expert.guidingQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-xs flex-shrink-0 mt-0.5" style={{ color: sessionColor }}>{i + 1}.</span>
                <span className="text-sm text-slate-200 flex-1 leading-snug">{q}</span>
                <button
                  onClick={() => copy(q)}
                  className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors p-0.5"
                  title="Copiar pregunta"
                >
                  <Copy size={12} />
                </button>
              </li>
            ))}
          </ol>
        </div>

        {expert.secondRound && (
          <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-400">
            🔄 Segunda ronda: {expert.secondRound}
          </div>
        )}
      </div>
    </div>
  )
}
