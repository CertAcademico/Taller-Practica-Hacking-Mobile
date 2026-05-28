import { useState } from "react"
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import type { Tool } from "@/types"

interface Props {
  tool: Tool
  sessionColor: string
}

export default function ToolCard({ tool, sessionColor }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg bg-elevated border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sessionColor }} />
          <span className="font-semibold text-slate-100 text-sm">{tool.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {tool.url && (
            <a
              href={tool.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
              style={{ backgroundColor: `${sessionColor}25`, color: sessionColor }}
            >
              <ExternalLink size={12} />
              Abrir
            </a>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-2 animate-block-expand">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Setup</p>
          <p className="text-sm text-slate-300 leading-relaxed">{tool.setup}</p>

          {tool.fields && tool.fields.length > 0 && (
            <ul className="mt-2 space-y-1">
              {tool.fields.map((f, i) => (
                <li key={i} className="text-xs text-slate-400 flex gap-2">
                  <span className="text-slate-600">•</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          {tool.timeline && tool.timeline.length > 0 && (
            <div className="mt-2 space-y-1">
              {tool.timeline.map((t, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <span className="font-mono text-slate-500 flex-shrink-0">{t.time}</span>
                  <span className="text-slate-300">{t.action}</span>
                </div>
              ))}
            </div>
          )}

          {tool.concepts && tool.concepts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tool.concepts.map((c, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">{c}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
