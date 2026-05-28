import { Users } from "lucide-react"
import SessionBadge from "@/components/SessionBadge"
import type { Session } from "@/types"

interface Props {
  session: Session
  isActive: boolean
  completedCount: number
  onClick: () => void
}

const STATUS_CHIP: Record<string, string> = {
  active:    "bg-green-900/70 text-green-300",
  upcoming:  "bg-blue-900/70 text-blue-300",
  completed: "bg-slate-700 text-slate-400",
}
const STATUS_LABEL: Record<string, string> = {
  active: "Hoy", upcoming: "Próxima", completed: "Completada",
}

export default function SessionCard({ session, isActive, completedCount, onClick }: Props) {
  const total = session.blocks.length
  const pct = total > 0 ? (completedCount / total) * 100 : 0

  return (
    <div
      onClick={onClick}
      className={`relative w-full cursor-pointer rounded-xl bg-surface border transition-all duration-200 hover:shadow-lg hover:border-slate-500 ${
        isActive ? "border-slate-500 shadow-md" : "border-slate-700/60"
      }`}
      style={isActive ? { boxShadow: `0 0 18px ${session.color}30` } : undefined}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: session.color }} />

      <div className="px-4 py-3 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SessionBadge session={session} size="sm" active={isActive} />
            <div className="min-w-0">
              <p className="font-semibold text-slate-100 text-sm truncate">{session.shortTitle}</p>
              <p className="text-xs text-slate-400 font-mono">{session.dateLabel}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_CHIP[session.status]}`}>
            {STATUS_LABEL[session.status]}
          </span>
        </div>

        <p className="text-xs text-slate-400 italic mt-2 leading-snug line-clamp-2">
          {session.rectora}
        </p>

        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{completedCount}/{total} bloques</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: session.color }}
            />
          </div>
        </div>

        {session.expertConference && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
            <Users size={11} />
            <span>Experto confirmado</span>
          </div>
        )}
      </div>
    </div>
  )
}
