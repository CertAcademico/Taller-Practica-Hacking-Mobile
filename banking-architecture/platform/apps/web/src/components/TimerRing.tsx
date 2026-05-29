import { useEffect, useRef } from "react"
import { useStore } from "@/store/useStore"

interface Props {
  totalSeconds: number
  elapsedSeconds: number
  sessionColor: string
  size?: number
  blockId: string
  blockDurationMin: number
}

function formatTime(secs: number): string {
  const m = Math.floor(Math.abs(secs) / 60)
  const s = Math.abs(secs) % 60
  const sign = secs < 0 ? "+" : ""
  return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function TimerRing({
  totalSeconds,
  elapsedSeconds,
  sessionColor,
  size = 120,
  blockId,
}: Props) {
  const pushToast = useStore((s) => s.pushToast)
  const alertedRef = useRef<Set<number>>(new Set())

  const radius = size / 2 - 6
  const circumference = 2 * Math.PI * radius
  const ratio = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0
  const remaining = totalSeconds - elapsedSeconds

  let strokeColor = sessionColor
  let pulse = false
  if (ratio >= 1.0) { strokeColor = "#EF4444"; pulse = true }
  else if (ratio >= 0.9) { strokeColor = "#EF4444"; pulse = true }
  else if (ratio >= 0.75) { strokeColor = "#F59E0B" }

  const offset = circumference * (1 - Math.min(ratio, 1))

  useEffect(() => {
    if (ratio >= 0.75 && !alertedRef.current.has(75)) {
      alertedRef.current.add(75)
      const mins = Math.ceil((totalSeconds * 0.25) / 60)
      pushToast(`Quedan ~${mins} min en este bloque`, "warning")
    }
    if (ratio >= 0.9 && !alertedRef.current.has(90)) {
      alertedRef.current.add(90)
      const mins = Math.ceil((totalSeconds * 0.10) / 60)
      pushToast(`¡Quedan ~${mins} min!`, "alert")
    }
  }, [ratio, totalSeconds, pushToast, blockId])

  useEffect(() => {
    alertedRef.current.clear()
  }, [blockId])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1F2937" strokeWidth={6}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={pulse ? "animate-timer-pulse" : ""}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono font-bold text-lg ${ratio >= 0.9 ? "text-red-400" : ratio >= 0.75 ? "text-amber-400" : "text-slate-100"}`}>
          {ratio >= 1 ? formatTime(remaining) : formatTime(remaining)}
        </span>
        {ratio >= 1 && (
          <span className="text-red-400 text-xs font-mono animate-timer-pulse">¡Tiempo!</span>
        )}
      </div>
    </div>
  )
}
