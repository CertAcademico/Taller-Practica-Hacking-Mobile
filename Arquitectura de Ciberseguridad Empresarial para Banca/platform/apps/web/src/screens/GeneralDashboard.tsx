import {
  ShieldAlert, Smartphone, Radar, Cloud, Target,
  Clock, BookOpen, Users, Lock, ChevronRight,
  GraduationCap, type LucideIcon,
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

const CATEGORY_COLORS: Record<string, string> = {
  "Ciberseguridad":        "#E53E3E",
  "Seguridad Ofensiva":    "#C05621",
  "Operaciones de Seguridad": "#2B6CB0",
  "Cloud Security":        "#276749",
}

const courses = coursesData.courses as Course[]

function CourseCard({ course }: { course: Course }) {
  const setActiveCourse = useStore((s) => s.setActiveCourse)
  const completedBlocks = useStore((s) => s.completedBlocks)
  const Icon = ICON_MAP[course.icon] ?? ShieldAlert
  const status = STATUS_CONFIG[course.status]
  const isAvailable = course.status === "active" || course.status === "completed"
  const catColor = CATEGORY_COLORS[course.category] ?? course.color

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
      {/* Color header strip */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: course.color }}
      />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${course.color}20` }}
          >
            <Icon size={20} style={{ color: course.color }} />
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Title & description */}
        <div className="flex-1">
          <h3 className="font-semibold text-slate-100 leading-snug mb-1">{course.shortTitle}</h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{course.description}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {course.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded bg-elevated text-slate-400 font-mono">
              {tag}
            </span>
          ))}
          {course.tags.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded bg-elevated text-slate-500">
              +{course.tags.length - 3}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <BookOpen size={11} />
              {course.totalSessions} sesiones
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {course.totalHours}h
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: `${catColor}15`, color: catColor }}
            >
              {course.level}
            </span>
          </div>
          {isAvailable && (
            <ChevronRight
              size={16}
              className="text-slate-600 group-hover:text-slate-300 transition-colors"
            />
          )}
        </div>
      </div>

      {/* Instructor */}
      <div className="px-5 pb-4">
        <p className="text-xs text-slate-600">
          <span className="text-slate-500">{course.instructor}</span>
          {" · "}
          <span>{course.cohort}</span>
        </p>
      </div>
    </div>
  )
}

export default function GeneralDashboard() {
  const activeCourses  = courses.filter((c) => c.status === "active")
  const upcomingCourses = courses.filter((c) => c.status === "coming-soon" || c.status === "planned")

  return (
    <div className="min-h-screen bg-base text-slate-100">
      {/* Top nav */}
      <header className="border-b border-slate-700/60 bg-surface/80 backdrop-blur sticky top-0 z-20">
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
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users size={13} />
            <span>{courses.length} cursos · {courses.filter(c => c.status === "active").length} activo</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">

        {/* Hero */}
        <div className="space-y-3">
          <h1 className="font-mono font-bold text-3xl text-slate-100 leading-tight">
            Catálogo de Cursos
          </h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
            Programas especializados en ciberseguridad para profesionales del sector financiero y tecnológico.
            Contenido actualizado, labs prácticos y expertos de la industria.
          </p>

          {/* Global stats */}
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { value: courses.length.toString(),           label: "Cursos" },
              { value: `${courses.reduce((a, c) => a + c.totalHours, 0)}h`, label: "Horas de contenido" },
              { value: `${courses.filter(c => c.status === "active").length}`, label: "Disponibles ahora" },
              { value: "CERT Acad.", label: "Institución" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 bg-elevated rounded-lg border border-slate-700/60">
                <span className="font-mono font-bold text-blue-400 text-sm">{s.value}</span>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active courses */}
        {activeCourses.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="font-semibold text-slate-200">Disponibles ahora</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">
                {activeCourses.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCourses.map((c) => <CourseCard key={c.id} course={c} />)}
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
              {upcomingCourses.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          </section>
        )}

        {/* Platform note */}
        <div className="rounded-2xl bg-elevated border border-slate-700/50 p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Lock size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-200 mb-1">CERT Académico – LabThinkTank</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Plataforma abierta de formación en ciberseguridad. Cada curso incluye contenido teórico,
              labs hands-on con Docker, escenarios reales del sector financiero colombiano y conferencias
              de expertos de la industria.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
