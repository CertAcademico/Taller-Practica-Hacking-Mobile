import {
  ShieldAlert, Cpu, FileText, Lock,
  type LucideIcon,
} from "lucide-react"
import type { Session } from "@/types"

const ICON_MAP: Record<string, LucideIcon> = {
  ShieldAlert,
  Cpu,
  FileText,
  Lock,
}

interface Props {
  session: Session
  size?: "sm" | "md" | "lg"
  showDate?: boolean
  active?: boolean
}

const SIZE = { sm: 28, md: 44, lg: 60 }
const TEXT = { sm: "text-xs", md: "text-base", lg: "text-xl" }

export default function SessionBadge({ session, size = "md", showDate, active }: Props) {
  const px = SIZE[size]
  const Icon = ICON_MAP[session.icon]

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded-full flex items-center justify-center flex-shrink-0 ${active ? "ring-2 ring-offset-2 ring-offset-surface" : ""}`}
        style={{
          width: px,
          height: px,
          backgroundColor: session.color,
          boxShadow: active ? `0 0 12px ${session.color}80` : undefined,
          ["--tw-ring-color" as string]: session.color,
        }}
      >
        {Icon ? (
          <Icon size={px * 0.45} color="#fff" strokeWidth={2} />
        ) : (
          <span className={`text-white font-bold font-mono ${TEXT[size]}`}>
            {session.number}
          </span>
        )}
      </div>
      {showDate && (
        <span className="text-xs text-slate-400 font-mono">{session.dateLabel}</span>
      )}
    </div>
  )
}
