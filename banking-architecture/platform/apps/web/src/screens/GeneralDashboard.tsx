import {
  ShieldAlert, Smartphone, Radar, Cloud, Target,
  Clock, BookOpen, Users, Lock, ChevronRight,
  GraduationCap, FlaskConical, FileText, CheckCircle2,
  TrendingUp, Layers, Zap, Circle, type LucideIcon,
} from "lucide-react"
import { useStore } from "@/store/useStore"
import type { Course } from "@/types"
import coursesData from "@/data/courses.json"

const ICON_MAP: Record<string, LucideIcon> = {
  ShieldAlert, Smartphone, Radar, Cloud, Target, Lock,
}

const STATUS_CONFIG = {
  "active":      { label: "Activo",       className: "bg-green-900/70 text-green-300 border-green-700/50"  },
  "coming-soon": { label: "Próximamente", className: "bg-amber-900/70 text-amber-300 border-amber-700/50"  },
  "planned":     { label: "Planificado",  className: "bg-slate-700/70 text-slate-400 border-slate-600/50"  },
  "completed":   { label: "Completado",   className: "bg-blue-900/70  text-blue-300  border-blue-700/50"   },
}

const courses = coursesData.courses as Course[]

// ─── Roadmap data ─────────────────────────────────────────────────────────────

const ROADMAP = [
  {
    phase: "Fase 1", label: "Infraestructura",
    items: [
      { label: "Repository Refactor",  done: true },
      { label: "Labs Architecture",    done: true },
      { label: "MITRE Structure",      done: true },
      { label: "Docker Base",          done: true },
      { label: "Offensive Pipelines",  done: true },
    ],
  },
  {
    phase: "Fase 2", label: "Labs",
    items: [
      { label: "Web Exploitation Labs",   done: true },
      { label: "OSINT Automation",        done: true },
      { label: "Active Directory Labs",   done: true },
      { label: "Cloud Security Labs",     done: true },
    ],
  },
  {
    phase: "Fase 3", label: "Plataforma",
    items: [
      { label: "Reporting Engine",              done: true },
      { label: "Dashboard Web UI",              done: false },
      { label: "AI-Assisted Reporting",         done: false },
      { label: "Threat Intelligence",           done: false },
    ],
  },
  {
    phase: "Fase 4", label: "Cyber Range",
    items: [
      { label: "Cyber Range",              done: false },
      { label: "SOC Integration",          done: false },
      { label: "Multiuser Environment",    done: false },
      { label: "Offensive Ops Platform",   done: false },
    ],
  },
]

const LAB_MODULES = [
  { name: "Linux CLI",     path: "labs/linux-cli",   status: "done",    labs: 1  },
  { name: "Redes",         path: "labs/redes",       status: "done",    labs: 1  },
  { name: "Bash",          path: "labs/bash-scripting", status: "done", labs: 1  },
  { name: "Mobile",        path: "labs/mobile",      status: "done",    labs: 6  },
  { name: "Web",           path: "labs/web",         status: "done",    labs: 6  },
  { name: "OSINT",         path: "labs/osint",       status: "done",    labs: 5  },
  { name: "Active Directory", path: "labs/ad",       status: "done",    labs: 6  },
  { name: "Cloud",         path: "labs/cloud",       status: "done",    labs: 6  },
  { name: "TryHackMe",     path: "labs/tryhackme",   status: "partial", labs: 1  },
  { name: "HackTheBox",    path: "labs/hackthebox",  status: "planned", labs: 0  },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, color }: {
  icon: LucideIcon; value: string; label: string; color: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded-xl border border-slate-700/60">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
           style={{ backgroundColor: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="font-bold text-lg text-slate-100 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  const setActiveCourse = useStore(s => s.setActiveCourse)
  const completedBlocks = useStore(s => s.completedBlocks)
  const Icon = ICON_MAP[course.icon] ?? ShieldAlert
  const status = STATUS_CONFIG[course.status]
  const isAvailable = course.status === "active" || course.status === "completed"

  return (
    <div
      onClick={() => isAvailable && setActiveCourse(course.id)}
      className={`group relative flex flex-col rounded-2xl border bg-surface overflow-hidden transition-all duration-200 ${
        isAvailable
          ? "cursor-pointer hover:border-slate-500 hover:shadow-xl hover:-translate-y-0.5"
          : "cursor-default opacity-70"
      }`}
      style={isAvailable ? { borderColor: `${course.color}40` } : { borderColor: "#374151" }}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: course.color }} />
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ backgroundColor: `${course.color}20` }}>
            <Icon size={20} style={{ color: course.color }} />
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-100 leading-snug mb-1">{course.shortTitle}</h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{course.description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {course.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded bg-elevated text-slate-400 font-mono">{tag}</span>
          ))}
          {course.tags.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded bg-elevated text-slate-500">+{course.tags.length - 3}</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><BookOpen size={11} />{course.totalSessions} sesiones</span>
            <span className="flex items-center gap-1"><Clock size={11} />{course.totalHours}h</span>
          </div>
          {isAvailable && (
            <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
          )}
        </div>
      </div>
      <div className="px-5 pb-4">
        <p className="text-xs text-slate-600">
          <span className="text-slate-500">{course.instructor}</span>{" · "}<span>{course.cohort}</span>
        </p>
      </div>
    </div>
  )
}

// ─── Roadmap Panel ────────────────────────────────────────────────────────────

function RoadmapPanel() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {ROADMAP.map(phase => {
        const done  = phase.items.filter(i => i.done).length
        const total = phase.items.length
        const pct   = Math.round((done / total) * 100)
        const allDone = done === total
        return (
          <div key={phase.phase}
               className={`rounded-xl border p-4 space-y-2.5 ${allDone ? "border-green-700/40 bg-green-900/10" : "border-slate-700/50 bg-surface"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-300">{phase.phase}</p>
                <p className="text-xs text-slate-500">{phase.label}</p>
              </div>
              <span className={`text-xs font-mono font-bold ${allDone ? "text-green-400" : "text-slate-400"}`}>
                {pct}%
              </span>
            </div>
            {/* progress bar */}
            <div className="h-1 rounded-full bg-elevated overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${pct}%`, backgroundColor: allDone ? "#38A169" : "#3182CE" }} />
            </div>
            <div className="space-y-1">
              {phase.items.map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  {item.done
                    ? <CheckCircle2 size={11} className="text-green-400 flex-shrink-0" />
                    : <Circle size={11} className="text-slate-600 flex-shrink-0" />
                  }
                  <span className={`text-xs truncate ${item.done ? "text-slate-400" : "text-slate-600"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Labs Overview ────────────────────────────────────────────────────────────

function LabsOverview({ onNavigateLabs }: { onNavigateLabs: () => void }) {
  const done    = LAB_MODULES.filter(l => l.status === "done").length
  const total   = LAB_MODULES.length
  const labsTotal = LAB_MODULES.reduce((a, l) => a + l.labs, 0)

  return (
    <div className="bg-surface rounded-2xl border border-slate-700/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical size={15} className="text-blue-400" />
          <h3 className="font-semibold text-slate-200 text-sm">Módulos de laboratorio</h3>
        </div>
        <button onClick={onNavigateLabs}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
          Ver todos <ChevronRight size={12} />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {LAB_MODULES.map(lab => (
          <div key={lab.name}
               className={`rounded-lg px-2 py-2 text-center border transition-colors ${
                 lab.status === "done"    ? "bg-green-900/20 border-green-700/30" :
                 lab.status === "partial" ? "bg-yellow-900/20 border-yellow-700/30" :
                                           "bg-elevated border-slate-700/40 opacity-50"
               }`}>
            <p className={`text-xs font-medium truncate ${
              lab.status === "done" ? "text-green-300" :
              lab.status === "partial" ? "text-yellow-300" : "text-slate-500"
            }`}>{lab.name}</p>
            {lab.labs > 0 && (
              <p className="text-xs text-slate-600 mt-0.5">{lab.labs} labs</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-700/40">
        <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-green-400" />{done}/{total} módulos</span>
        <span className="flex items-center gap-1"><Layers size={11} />{labsTotal} labs totales</span>
      </div>
    </div>
  )
}

// ─── Activity Panel ───────────────────────────────────────────────────────────

function ActivityPanel() {
  const completedBlocks  = useStore(s => s.completedBlocks)
  const assignedReadings = useStore(s => s.assignedReadings)
  const checkedActions   = useStore(s => s.checkedActions)

  const items = [
    { icon: CheckCircle2, color: "#38A169", value: completedBlocks.length,  label: "Bloques completados" },
    { icon: BookOpen,     color: "#3182CE", value: assignedReadings.length,  label: "Lecturas asignadas"  },
    { icon: Zap,          color: "#D69E2E", value: checkedActions.length,    label: "Acciones realizadas" },
  ]

  return (
    <div className="bg-surface rounded-2xl border border-slate-700/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={15} className="text-blue-400" />
        <h3 className="font-semibold text-slate-200 text-sm">Tu actividad</h3>
      </div>
      <div className="space-y-3">
        {items.map(({ icon: Icon, color, value, label }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon size={13} style={{ color }} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
      {completedBlocks.length === 0 && (
        <p className="text-xs text-slate-600 text-center pt-1">
          Abre un curso y completa tu primer bloque
        </p>
      )}
    </div>
  )
}

// ─── Quick Access ─────────────────────────────────────────────────────────────

function QuickAccess({ onNavigate }: { onNavigate: (v: "labs" | "reports") => void }) {
  return (
    <div className="bg-surface rounded-2xl border border-slate-700/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap size={15} className="text-blue-400" />
        <h3 className="font-semibold text-slate-200 text-sm">Acceso rápido</h3>
      </div>
      <div className="space-y-2">
        <button onClick={() => onNavigate("labs")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-elevated border border-slate-700/50 hover:border-slate-500 transition-colors text-left group">
          <div className="w-8 h-8 rounded-lg bg-blue-900/40 flex items-center justify-center">
            <FlaskConical size={15} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-200">Laboratorios</p>
            <p className="text-xs text-slate-500">8 módulos · 32+ labs disponibles</p>
          </div>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
        </button>
        <button onClick={() => onNavigate("reports")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-elevated border border-slate-700/50 hover:border-slate-500 transition-colors text-left group">
          <div className="w-8 h-8 rounded-lg bg-green-900/40 flex items-center justify-center">
            <FileText size={15} className="text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-200">Reporting Engine</p>
            <p className="text-xs text-slate-500">Generar reporte de pentest</p>
          </div>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function GeneralDashboard() {
  const navigate        = useStore(s => s.navigate)
  const activeCourses   = courses.filter(c => c.status === "active")
  const upcomingCourses = courses.filter(c => c.status === "coming-soon" || c.status === "planned")

  const totalHours  = courses.reduce((a, c) => a + c.totalHours, 0)
  const labsTotal   = LAB_MODULES.reduce((a, l) => a + l.labs, 0)
  const phasesDone  = ROADMAP.filter(p => p.items.every(i => i.done)).length

  return (
    <div className="min-h-screen bg-base text-slate-100">

      {/* Top nav */}
      <header className="border-b border-slate-700/60 bg-surface sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-100 leading-tight">CERT Académico</p>
              <p className="text-xs text-slate-500 leading-none">LabThinkTank · Plataforma de Aprendizaje</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("labs")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-elevated border border-slate-700/50 text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-colors">
              <FlaskConical size={13} />Labs
            </button>
            <button onClick={() => navigate("reports")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-elevated border border-slate-700/50 text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-colors">
              <FileText size={13} />Reportes
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 ml-2">
              <Users size={13} />
              <span>{courses.length} cursos</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* Hero + stats */}
        <div className="space-y-5">
          <div>
            <h1 className="font-mono font-bold text-3xl text-slate-100 leading-tight">
              LabThinkTank
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Plataforma de formación en ciberseguridad ofensiva. Labs dockerizados,
              metodología MITRE ATT&CK y cursos para el sector financiero.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={BookOpen}     value={`${activeCourses.length}`}   label="Cursos activos"        color="#3182CE" />
            <StatCard icon={FlaskConical} value={`${labsTotal}`}              label="Labs disponibles"      color="#805AD5" />
            <StatCard icon={Clock}        value={`${totalHours}h`}            label="Horas de contenido"    color="#D69E2E" />
            <StatCard icon={TrendingUp}   value={`${phasesDone}/4`}           label="Fases completadas"     color="#38A169" />
          </div>
        </div>

        {/* Roadmap */}
        <section className="space-y-4">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp size={15} className="text-blue-400" />
            Roadmap del proyecto
          </h2>
          <RoadmapPanel />
        </section>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Lab modules + quick access */}
          <div className="space-y-4">
            <LabsOverview onNavigateLabs={() => navigate("labs")} />
            <QuickAccess onNavigate={navigate} />
          </div>

          {/* Right: Activity */}
          <div className="lg:col-span-2 space-y-4">
            <ActivityPanel />

            {/* Platform note */}
            <div className="rounded-2xl bg-elevated border border-slate-700/50 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <Lock size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 mb-1">CERT Académico – LabThinkTank</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Plataforma abierta de formación en ciberseguridad. Cada curso incluye contenido teórico,
                  labs hands-on con Docker, escenarios reales del sector financiero y conferencias de expertos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active courses */}
        {activeCourses.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="font-semibold text-slate-200">Cursos disponibles</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">
                {activeCourses.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCourses.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcomingCourses.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <h2 className="font-semibold text-slate-400">En construcción</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                {upcomingCourses.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingCourses.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
