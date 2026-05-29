import { ExternalLink } from "lucide-react"
import { useStore } from "@/store/useStore"
import type { Reading } from "@/types"

interface Props {
  reading: Reading
  assigned: boolean
}

export default function ReadingItem({ reading, assigned }: Props) {
  const toggleReadingAssigned = useStore((s) => s.toggleReadingAssigned)
  const assignedReadings = useStore((s) => s.assignedReadings)
  const isChecked = assignedReadings.includes(reading.title)

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-700/50 last:border-0">
      <button
        onClick={() => toggleReadingAssigned(reading.title)}
        className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          isChecked
            ? "bg-green-500 border-green-500"
            : "border-slate-600 hover:border-slate-400"
        }`}
      >
        {isChecked && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <a
            href={reading.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors leading-snug flex items-center gap-1"
          >
            {reading.title}
            <ExternalLink size={11} className="flex-shrink-0 opacity-60" />
          </a>
          {!assigned && (
            <span className="text-xs px-1.5 py-0.5 bg-amber-900/60 text-amber-300 rounded font-medium">
              Por asignar
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{reading.author}</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-500">{reading.pages}</span>
        </div>
      </div>
    </div>
  )
}
