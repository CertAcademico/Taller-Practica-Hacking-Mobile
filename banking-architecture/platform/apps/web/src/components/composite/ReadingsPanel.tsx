import { Copy, BookMarked, BookPlus } from "lucide-react"
import ReadingItem from "@/components/ReadingItem"
import type { Readings } from "@/types"

interface Props {
  readings: Readings
}

export default function ReadingsPanel({ readings }: Props) {
  const copyLinks = (list: typeof readings.assigned) => {
    const text = list.map((r) => `${r.title} — ${r.author}\n${r.url}`).join("\n\n")
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookMarked size={15} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Lecturas asignadas</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300">
              {readings.assigned.length}
            </span>
          </div>
        </div>
        <div>
          {readings.assigned.map((r) => (
            <ReadingItem key={r.title} reading={r} assigned={true} />
          ))}
        </div>
      </div>

      {readings.toAssign.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookPlus size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">Lecturas a asignar al cierre</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300">
                {readings.toAssign.length}
              </span>
            </div>
            <button
              onClick={() => copyLinks(readings.toAssign)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Copy size={12} />
              Copiar links
            </button>
          </div>
          <div>
            {readings.toAssign.map((r) => (
              <ReadingItem key={r.title} reading={r} assigned={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
