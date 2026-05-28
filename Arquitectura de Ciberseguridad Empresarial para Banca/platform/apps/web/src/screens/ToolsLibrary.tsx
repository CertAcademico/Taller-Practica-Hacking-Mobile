import { ArrowLeft, ExternalLink } from "lucide-react"
import SessionBadge from "@/components/SessionBadge"
import { useStore } from "@/store/useStore"
import type { Session } from "@/types"

type FilterId = "all" | "s1" | "s2" | "s3" | "s4"

const CATEGORY_MAP: Record<string, string> = {
  "Padlet": "Colaboración",
  "Miro": "Colaboración",
  "FigJam": "Colaboración",
  "Mentimeter": "Encuesta",
  "Wooclap": "Encuesta",
  "Poll Everywhere": "Encuesta",
  "Kahoot!": "Quiz",
  "Quizlet Live": "Quiz",
  "Socrative": "Evaluación",
  "Microsoft Forms": "Evaluación",
  "MITRE ATT&CK Navigator": "Técnica",
  "Slido (Q&A moderado)": "Q&A",
  "Slido": "Q&A",
  "Genially + draw.io": "Técnica",
  "Roleplay estructurado (sin herramienta digital)": "Dinámica",
}

interface Props {
  sessions: Session[]
}

export default function ToolsLibrary({ sessions }: Props) {
  const navigate = useStore((s) => s.navigate)

  const toolMap = new Map<string, { tool: { name: string; url: string | null; setup: string }; sessions: Session[] }>()

  sessions.forEach((session) => {
    session.blocks.forEach((block) => {
      if (!block.tool) return
      const key = block.tool.name
      if (!toolMap.has(key)) {
        toolMap.set(key, { tool: block.tool, sessions: [] })
      }
      const entry = toolMap.get(key)!
      if (!entry.sessions.find((s) => s.id === session.id)) {
        entry.sessions.push(session)
      }
    })
  })

  const tools = Array.from(toolMap.values()).sort((a, b) => a.tool.name.localeCompare(b.tool.name))

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("course")}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Curso
          </button>
        </div>

        <div className="mb-8">
          <h1 className="font-mono font-bold text-2xl text-slate-100">Catálogo de Herramientas</h1>
          <p className="text-slate-400 text-sm mt-1">
            {tools.length} herramientas · Sin repetición entre sesiones por función pedagógica
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(({ tool, sessions: toolSessions }) => {
            const category = CATEGORY_MAP[tool.name] ?? "Otro"
            return (
              <div key={tool.name} className="bg-surface rounded-xl border border-slate-700/60 overflow-hidden hover:border-slate-500 transition-colors">
                <div className="px-4 py-3 border-b border-slate-700/40 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-100 text-sm">{tool.name}</p>
                    <span className="text-xs text-slate-500">{category}</span>
                  </div>
                  {tool.url && (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-colors"
                    >
                      <ExternalLink size={12} className="text-slate-300" />
                    </a>
                  )}
                </div>

                <div className="px-4 py-3 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {toolSessions.map((s) => (
                      <div key={s.id} className="flex items-center gap-1">
                        <SessionBadge session={s} size="sm" />
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{tool.setup}</p>

                  <div className="rounded-lg bg-elevated px-3 py-2">
                    <p className="text-xs text-slate-500 font-medium mb-1">¿Cuándo usarla?</p>
                    <p className="text-xs text-slate-400">
                      {category === "Quiz" && "Verificación de lecturas o repaso de conceptos al inicio de sesión."}
                      {category === "Encuesta" && "Termómetro grupal, votaciones interactivas o word cloud de apertura."}
                      {category === "Colaboración" && "Trabajo en grupos simultáneo: mapas, post-its digitales, síntesis."}
                      {category === "Evaluación" && "Diagnóstico o evaluación sumativa con reporte automático."}
                      {category === "Q&A" && "Preguntas anónimas al experto durante o después de la conferencia."}
                      {category === "Técnica" && "Análisis técnico de amenazas, arquitecturas o escenarios."}
                      {category === "Dinámica" && "Actividad presencial sin pantalla — roleplay o escape room físico."}
                      {category === "Otro" && "Herramienta de apoyo según el contexto del bloque."}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
