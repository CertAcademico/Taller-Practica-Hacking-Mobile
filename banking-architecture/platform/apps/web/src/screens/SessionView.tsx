import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import SessionTimer from "@/components/composite/SessionTimer"
import BlockRow from "@/components/composite/BlockRow"
import BlockDetail from "@/components/composite/BlockDetail"
import PitchPanel from "@/components/composite/PitchPanel"
import ReadingsPanel from "@/components/composite/ReadingsPanel"
import ExpertCard from "@/components/composite/ExpertCard"
import { useStore } from "@/store/useStore"
import type { Session, ActiveTab } from "@/types"

interface Props {
  session: Session
}

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "blocks", label: "Bloques" },
  { id: "pitch", label: "Pitch" },
  { id: "readings", label: "Lecturas" },
  { id: "expert", label: "Experto" },
]

export default function SessionView({ session }: Props) {
  const { navigate, activeBlockId, activeTab, setActiveTab, startTimer, completeBlock, completedBlocks } = useStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleBlock = (id: string) => setExpandedId((prev) => (prev === id ? null : id))
  const activeBlock = session.blocks.find((b) => b.id === activeBlockId) ?? null
  const activeIdx = activeBlock ? session.blocks.indexOf(activeBlock) : -1
  const nextBlock = activeIdx >= 0 ? session.blocks[activeIdx + 1] : null

  return (
    <div className="min-h-screen bg-base text-slate-100 flex flex-col">
      <SessionTimer session={session} />

      {/* Back nav */}
      <div className="px-6 py-3 border-b border-slate-700/40 flex items-center gap-3">
        <button
          onClick={() => navigate("course")}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={14} /> Curso
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-300 font-medium">{session.shortTitle}</span>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — tabs */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex gap-0 border-b border-slate-700/60 px-6 pt-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? "border-current text-slate-100"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
                style={activeTab === tab.id ? { color: session.color, borderColor: session.color } : undefined}
              >
                {tab.label}
                {tab.id === "expert" && !session.expertConference && (
                  <span className="ml-1 text-xs text-slate-600">—</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "blocks" && (
              <div className="space-y-2 max-w-2xl">
                {session.blocks.map((block) => (
                  <div key={block.id}>
                    <BlockRow
                      block={block}
                      sessionColor={session.color}
                      isActive={block.id === activeBlockId}
                      isCurrent={block.id === activeBlockId}
                      isCompleted={completedBlocks.includes(block.id)}
                      isExpanded={expandedId === block.id}
                      onToggle={() => toggleBlock(block.id)}
                      onStart={() => { startTimer(block.id); setExpandedId(block.id) }}
                      onComplete={() => completeBlock(block.id)}
                    />
                    {expandedId === block.id && (
                      <div className="mt-1 mb-2 px-4 py-4 rounded-b-lg bg-elevated border border-t-0 border-slate-700/60">
                        <BlockDetail block={block} sessionColor={session.color} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "pitch" && <PitchPanel session={session} />}
            {activeTab === "readings" && <ReadingsPanel readings={session.readings} />}
            {activeTab === "expert" && (
              session.expertConference
                ? <ExpertCard expert={session.expertConference} sessionColor={session.color} />
                : (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
                    Esta sesión no incluye conferencia de experto.
                  </div>
                )
            )}
          </div>
        </div>

        {/* RIGHT — active block detail (sticky) */}
        <div className="w-80 flex-shrink-0 border-l border-slate-700/60 overflow-y-auto p-4 space-y-4 hidden lg:block">
          {activeBlock ? (
            <div className="rounded-xl bg-elevated border border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bloque activo</p>
                <span className="font-mono text-xs" style={{ color: session.color }}>
                  {activeBlock.start}–{activeBlock.end}
                </span>
              </div>
              <p className="font-semibold text-slate-100 text-sm leading-snug">{activeBlock.title}</p>
              <BlockDetail block={activeBlock} sessionColor={session.color} />
              <button
                onClick={() => completeBlock(activeBlock.id)}
                className="w-full py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: session.color }}
              >
                ✓ Completar bloque
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-elevated border border-slate-700/50 p-4 text-center">
              <p className="text-slate-500 text-sm">Ningún bloque activo</p>
              <p className="text-xs text-slate-600 mt-1">Inicia un bloque desde la lista</p>
            </div>
          )}

          {nextBlock && (
            <div className="rounded-xl bg-surface border border-slate-700/50 p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Siguiente</p>
              <p className="text-sm text-slate-300 font-medium leading-snug">{nextBlock.title}</p>
              <p className="font-mono text-xs text-slate-500 mt-1">{nextBlock.start} · {nextBlock.duration}′</p>
              <button
                onClick={() => { startTimer(nextBlock.id); setExpandedId(nextBlock.id); setActiveTab("blocks") }}
                className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                ▶ Iniciar
              </button>
            </div>
          )}

          {activeBlock?.tool && (
            <div className="rounded-xl bg-surface border border-slate-700/50 p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Herramienta activa</p>
              <p className="font-semibold text-sm text-slate-200">{activeBlock.tool.name}</p>
              {activeBlock.tool.url && (
                <a
                  href={activeBlock.tool.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: session.color }}
                >
                  🔗 Abrir en nueva pestaña
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
