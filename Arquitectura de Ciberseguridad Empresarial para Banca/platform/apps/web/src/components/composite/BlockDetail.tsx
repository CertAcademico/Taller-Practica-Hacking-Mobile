import { Lightbulb, List, Wrench, BookOpen, Users } from "lucide-react"
import ToolCard from "@/components/ToolCard"
import BlockTypePill from "@/components/BlockTypePill"
import type { Block } from "@/types"

interface Props {
  block: Block
  sessionColor: string
}

export default function BlockDetail({ block, sessionColor }: Props) {
  return (
    <div className="space-y-4 animate-block-expand overflow-hidden">
      <div className="flex items-center gap-2 flex-wrap">
        <BlockTypePill type={block.type} />
        <span className="font-mono text-xs text-slate-500">
          {block.start} – {block.end} · {block.duration} min
        </span>
      </div>

      {block.description && (
        <p className="text-sm text-slate-300 leading-relaxed">{block.description}</p>
      )}

      {block.keyActions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <List size={14} style={{ color: sessionColor }} />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Acciones clave</span>
          </div>
          <ol className="space-y-1.5">
            {block.keyActions.map((action, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                <span className="font-mono text-slate-600 flex-shrink-0 text-xs mt-0.5">{i + 1}.</span>
                {action}
              </li>
            ))}
          </ol>
        </div>
      )}

      {block.speakerNote && (
        <div className="rounded-lg bg-amber-950/40 border border-amber-800/50 px-4 py-3 flex gap-3">
          <Lightbulb size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200 leading-relaxed">{block.speakerNote}</p>
        </div>
      )}

      {block.tool && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={14} style={{ color: sessionColor }} />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Herramienta</span>
          </div>
          <ToolCard tool={block.tool} sessionColor={sessionColor} />
        </div>
      )}

      {block.caseStudy && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} style={{ color: sessionColor }} />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Caso de estudio</span>
          </div>
          <div className="rounded-lg bg-elevated border border-slate-700 p-4 space-y-3">
            <h4 className="font-semibold text-slate-100">{block.caseStudy.title}</h4>
            {block.caseStudy.narrative && (
              <blockquote className="border-l-2 pl-3 text-sm text-slate-300 leading-relaxed italic" style={{ borderLeftColor: sessionColor }}>
                {block.caseStudy.narrative}
              </blockquote>
            )}
            {block.caseStudy.profile && (
              <p className="text-sm text-slate-300 leading-relaxed">{block.caseStudy.profile}</p>
            )}
            {block.caseStudy.questions && block.caseStudy.questions.length > 0 && (
              <ol className="space-y-2 mt-2">
                {block.caseStudy.questions.map((q, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="font-mono font-bold flex-shrink-0" style={{ color: sessionColor }}>{i + 1}.</span>
                    <span className="text-slate-200">{q}</span>
                  </li>
                ))}
              </ol>
            )}
            {block.caseStudy.matrix && (
              <div className="overflow-x-auto mt-2">
                <table className="text-xs w-full border-collapse">
                  <thead>
                    <tr>
                      {block.caseStudy.matrix.headers.map((h, i) => (
                        <th key={i} className="text-left px-2 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.caseStudy.matrix.rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-slate-800/50">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-2 py-1.5 text-slate-300 border border-slate-700">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {block.tool?.groups && (
            <div className="mt-3 space-y-2">
              {block.tool.groups.map((g, i) => (
                <div key={i} className="rounded-lg bg-elevated border border-slate-700 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={13} style={{ color: sessionColor }} />
                    <span className="font-semibold text-sm text-slate-200">{g.name}</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-400">{g.sector}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-1">{g.scenario}</p>
                  <p className="text-xs text-slate-500 italic">{g.source}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
