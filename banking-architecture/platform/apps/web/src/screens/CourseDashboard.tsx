import { LayoutDashboard, BookOpen, Wrench, CheckSquare, Square, ChevronLeft, ShieldAlert, type LucideIcon } from "lucide-react"
import SessionCard from "@/components/composite/SessionCard"
import { useStore } from "@/store/useStore"
import type { Course, Session } from "@/types"

const ICON_MAP: Record<string, LucideIcon> = { ShieldAlert }

const NEXT_ACTIONS = [
  { id: "a1", label: "Preparar Padlet para S1 (Wall + campos configurados)" },
  { id: "a2", label: "Preparar tablero Miro con Kill Chain de 7 fases (3 secciones)" },
  { id: "a3", label: "Precargar layer Blind Eagle en MITRE ATT&CK Navigator" },
  { id: "a4", label: "Confirmar experto S2 antes del 1 Jun" },
  { id: "a5", label: "Enviar lecturas S2 al finalizar S1" },
  { id: "a6", label: "Preparar Kahoot! 10 preguntas (lecturas S2)" },
  { id: "a7", label: "Confirmar experto S3 antes del 2 Jun" },
  { id: "a8", label: "Preparar Genially Escape Room (5 salas) para S4" },
]

interface Props {
  course: Course
  sessions: Session[]
}

export default function CourseDashboard({ course, sessions }: Props) {
  const { navigate, setActiveSession, completedBlocks, checkedActions, toggleActionChecked } = useStore()
  const Icon = ICON_MAP[course.icon] ?? ShieldAlert
  const today = new Date().toISOString().slice(0, 10)

  const handleOpenSession = (s: Session) => {
    setActiveSession(s.id)
    navigate("session")
  }

  const toolCount  = sessions.reduce((acc, s) => acc + s.blocks.filter((b) => b.tool).length, 0)
  const expertCount = sessions.filter((s) => s.expertConference).length
  const nextSession = sessions.find((s) => s.date > today)

  return (
    <div className="flex min-h-screen bg-base text-slate-100">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-surface border-r border-slate-700/60 flex flex-col">
        {/* Back to home */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft size={13} /> Todos los cursos
          </button>
        </div>

        {/* Course identity */}
        <div className="px-5 py-3 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${course.color}20` }}
            >
              <Icon size={18} style={{ color: course.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-100 text-sm leading-tight truncate">{course.shortTitle}</p>
              <p className="text-xs text-slate-500 truncate">{course.cohort}</p>
            </div>
          </div>
        </div>

        <nav className="px-3 py-3 border-b border-slate-700/60 space-y-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 text-sm font-medium">
            <LayoutDashboard size={15} /> Inicio del curso
          </button>
          <button
            onClick={() => navigate("bibliography")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            <BookOpen size={15} /> Bibliografía
          </button>
          <button
            onClick={() => navigate("tools")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            <Wrench size={15} /> Herramientas
          </button>
        </nav>

        <div className="px-3 py-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 mb-3">
            Sesiones
          </p>
          <div className="space-y-2">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                isActive={s.status === "active"}
                completedCount={s.blocks.filter((b) => completedBlocks.includes(b.id)).length}
                onClick={() => handleOpenSession(s)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <div>
            <h1 className="font-mono font-bold text-2xl text-slate-100 mb-1">
              {course.title}
            </h1>
            <p className="text-sm text-slate-400">{course.instructor} · {course.institution}</p>

            <div className="flex flex-wrap gap-3 mt-4">
              {[
                { label: "Sesiones",  value: sessions.length.toString() },
                { label: "Próxima",   value: nextSession?.dateLabel ?? "—" },
                { label: "Expertos",  value: expertCount.toString() },
                { label: "Herramientas", value: `${toolCount}+` },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 px-3 py-1.5 bg-elevated rounded-lg border border-slate-700/60">
                  <span className="font-mono font-bold text-blue-400">{stat.value}</span>
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active session CTA */}
          {(() => {
            const active = sessions.find((s) => s.status === "active")
            if (!active) return null
            return (
              <div
                className="rounded-xl p-5 border"
                style={{ backgroundColor: `${active.color}12`, borderColor: `${active.color}40` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: active.color }}>
                      Sesión activa hoy
                    </p>
                    <h2 className="font-bold text-lg text-slate-100 leading-tight">{active.title}</h2>
                    <p className="text-sm text-slate-400 italic mt-1">{active.rectora}</p>
                    <div className="flex gap-4 mt-3 text-xs text-slate-400">
                      <span>{active.blocks.length} bloques</span>
                      <span>{active.blocks.reduce((a, b) => a + b.duration, 0)} min</span>
                      <span>{active.blocks.filter((b) => b.tool).length} herramientas</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenSession(active)}
                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: active.color }}
                  >
                    ▶ Abrir sesión
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Sessions grid */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Panorama del programa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  isActive={s.status === "active"}
                  completedCount={s.blocks.filter((b) => completedBlocks.includes(b.id)).length}
                  onClick={() => handleOpenSession(s)}
                />
              ))}
            </div>
          </div>

          {/* Next actions */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Próximas acciones del docente
            </h2>
            <div className="space-y-2">
              {NEXT_ACTIONS.map((action) => {
                const checked = checkedActions.includes(action.id)
                return (
                  <button
                    key={action.id}
                    onClick={() => toggleActionChecked(action.id)}
                    className={`w-full flex items-start gap-3 text-left px-4 py-3 rounded-lg border transition-colors ${
                      checked
                        ? "bg-green-950/30 border-green-800/40 opacity-60"
                        : "bg-surface border-slate-700/60 hover:border-slate-500"
                    }`}
                  >
                    {checked
                      ? <CheckSquare size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                      : <Square size={15} className="text-slate-500 flex-shrink-0 mt-0.5" />
                    }
                    <span className={`text-sm ${checked ? "line-through text-slate-500" : "text-slate-200"}`}>
                      {action.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
