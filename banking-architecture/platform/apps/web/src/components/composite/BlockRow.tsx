import {
  Play, CheckCircle2, Coffee, Wrench,
  Presentation, BookOpen, Layout, GitBranch, Target,
  FileSearch, Brain, Phone, Shield, Globe, BarChart2,
  Map, Monitor, Award, MessageSquare, Zap, ClipboardList,
  TrendingUp, Circle, Layers, Search, UserCheck, Lock, Cpu,
  FileText, ShieldAlert,
  type LucideIcon,
} from "lucide-react"
import BlockTypePill from "@/components/BlockTypePill"
import { useStore } from "@/store/useStore"
import type { Block } from "@/types"

const ICON_MAP: Record<string, LucideIcon> = {
  Presentation, BookOpen, Layout, GitBranch, Target, FileSearch,
  Coffee, Brain, Phone, Shield, Globe, BarChart2, Map, Monitor,
  Award, MessageSquare, Zap, ClipboardList, TrendingUp, Circle,
  Layers, Search, UserCheck, Lock, Cpu, FileText, ShieldAlert,
  CheckCircle: CheckCircle2,
}

interface Props {
  block: Block
  sessionColor: string
  isActive: boolean
  isCurrent: boolean
  isCompleted: boolean
  isExpanded: boolean
  onToggle: () => void
  onStart: () => void
  onComplete: () => void
}

export default function BlockRow({
  block, sessionColor, isCurrent, isCompleted, isExpanded, onToggle, onStart, onComplete,
}: Props) {
  const Icon = ICON_MAP[block.icon] ?? Play
  const isBreak = block.type === "break"

  return (
    <div
      className={`rounded-lg border transition-all ${
        isBreak
          ? "bg-amber-950/30 border-amber-800/40"
          : isCurrent
          ? "border-slate-500 bg-elevated"
          : "border-slate-700/50 bg-surface hover:border-slate-600"
      }`}
      style={isCurrent ? { borderLeftColor: sessionColor, borderLeftWidth: 3, boxShadow: `0 0 12px ${sessionColor}20` } : undefined}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        <span className="font-mono text-xs text-slate-500 w-20 flex-shrink-0">
          {block.start}–{block.end}
        </span>

        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isCompleted ? "bg-green-900/60" : ""}`}
          style={!isCompleted ? { backgroundColor: `${sessionColor}20` } : undefined}
        >
          {isCompleted
            ? <CheckCircle2 size={14} className="text-green-400" />
            : <Icon size={14} style={{ color: isBreak ? "#F59E0B" : sessionColor }} />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium truncate ${isCurrent ? "text-slate-100" : "text-slate-200"}`}>
              {block.title}
            </span>
            <BlockTypePill type={block.type} />
            {block.tool && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 hidden sm:inline">
                {block.tool.name}
              </span>
            )}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-mono flex-shrink-0 ml-2">
          {block.duration}′
        </span>

        {!isCompleted && !isBreak && (
          <button
            onClick={(e) => { e.stopPropagation(); isCurrent ? onComplete() : onStart() }}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              isCurrent
                ? "bg-green-700 hover:bg-green-600 text-white"
                : "hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            {isCurrent ? <><CheckCircle2 size={12} /> Completar</> : <><Play size={12} /> Iniciar</>}
          </button>
        )}
      </div>
    </div>
  )
}
