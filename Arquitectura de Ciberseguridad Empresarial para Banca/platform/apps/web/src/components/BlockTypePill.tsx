import type { BlockType } from "@/types"

const CONFIG: Record<BlockType, { bg: string; text: string; label: string }> = {
  opening:    { bg: "bg-slate-700",   text: "text-slate-200", label: "Apertura"  },
  lecture:    { bg: "bg-blue-900",    text: "text-blue-200",  label: "Magistral" },
  activity:   { bg: "bg-violet-900",  text: "text-violet-200",label: "Actividad" },
  break:      { bg: "bg-amber-900",   text: "text-amber-200", label: "Descanso"  },
  expert:     { bg: "bg-green-900",   text: "text-green-200", label: "Experto"   },
  autonomous: { bg: "bg-orange-900",  text: "text-orange-200",label: "Autónomo"  },
  closing:    { bg: "bg-teal-900",    text: "text-teal-200",  label: "Cierre"    },
}

interface Props {
  type: BlockType
}

export default function BlockTypePill({ type }: Props) {
  const { bg, text, label } = CONFIG[type] ?? CONFIG.opening
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}
