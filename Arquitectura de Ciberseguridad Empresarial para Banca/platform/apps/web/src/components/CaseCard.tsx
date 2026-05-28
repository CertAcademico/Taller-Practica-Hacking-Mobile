import type { KeyCase } from "@/types"

interface Props {
  kcase: KeyCase
  accentColor: string
}

export default function CaseCard({ kcase, accentColor }: Props) {
  return (
    <div
      className="bg-elevated rounded-lg p-4 border-l-4"
      style={{ borderLeftColor: accentColor }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-slate-100 text-sm">{kcase.entity}</span>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
        >
          {kcase.year}
        </span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed mb-2">{kcase.fact}</p>
      <p className="text-xs text-slate-500 italic">{kcase.source}</p>
    </div>
  )
}
