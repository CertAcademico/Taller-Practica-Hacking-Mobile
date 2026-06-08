import { useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import TimerRing from "@/components/TimerRing"
import { useStore } from "@/store/useStore"
import type { Session } from "@/types"

interface Props {
  session: Session
}

export default function SessionTimer({ session }: Props) {
  const { timer, startTimer, pauseTimer, resumeTimer, tickTimer, resetTimer, completeBlock, activeBlockId } = useStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeBlock = session.blocks.find((b) => b.id === activeBlockId) ?? null
  const activeIdx = activeBlock ? session.blocks.indexOf(activeBlock) : -1
  const nextBlock = activeIdx >= 0 ? session.blocks[activeIdx + 1] : null

  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => tickTimer(), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timer.isRunning, tickTimer])

  const totalSeconds = activeBlock ? activeBlock.duration * 60 : 0

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-surface border-b border-slate-700/60"
      style={{ borderTop: `3px solid ${session.color}` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: session.color }}
        />
        <div className="min-w-0">
          <p className="font-semibold text-slate-100 text-sm truncate">{session.shortTitle}</p>
          <p className="text-xs text-slate-400 font-mono">{session.dateLabel}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        {activeBlock ? (
          <>
            <TimerRing
              totalSeconds={totalSeconds}
              elapsedSeconds={timer.elapsed}
              sessionColor={session.color}
              size={64}
              blockId={activeBlock.id}
              blockDurationMin={activeBlock.duration}
            />
            <p className="text-xs text-slate-400 max-w-[180px] truncate text-center">{activeBlock.title}</p>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl text-slate-600">--:--</span>
            <span className="text-xs text-slate-600">Sin bloque activo</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {activeBlock && (
          <>
            {timer.isRunning ? (
              <button
                onClick={pauseTimer}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-colors"
                title="Pausar"
              >
                <Pause size={14} className="text-slate-200" />
              </button>
            ) : timer.isPaused ? (
              <button
                onClick={resumeTimer}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-colors"
                title="Reanudar"
              >
                <Play size={14} className="text-slate-200" />
              </button>
            ) : null}
            <button
              onClick={resetTimer}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw size={14} className="text-slate-200" />
            </button>
          </>
        )}
        {nextBlock && (
          <button
            onClick={() => startTimer(nextBlock.id)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            title="Siguiente bloque"
          >
            <SkipForward size={12} />
            <span className="hidden sm:inline">Siguiente</span>
          </button>
        )}
      </div>
    </div>
  )
}
