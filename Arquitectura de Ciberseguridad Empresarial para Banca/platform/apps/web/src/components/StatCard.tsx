interface Props {
  value: string
  label: string
  source: string
  color: string
}

export default function StatCard({ value, label, source, color }: Props) {
  return (
    <div className="bg-elevated rounded-xl p-4 hover:shadow-lg transition-shadow border border-slate-700/50 flex flex-col gap-2">
      <span className="font-mono font-bold text-2xl leading-none" style={{ color }}>
        {value}
      </span>
      <span className="text-sm text-slate-200 font-medium leading-snug">{label}</span>
      <span className="text-xs text-slate-500 mt-auto">{source}</span>
    </div>
  )
}
