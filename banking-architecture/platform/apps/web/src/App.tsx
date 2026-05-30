import { useEffect } from "react"
import sessionsData       from "./data/sessions.json"
import mobileSessions     from "./data/mobile-sessions.json"
import coursesData from "./data/courses.json"
import GeneralDashboard from "./screens/GeneralDashboard"
import CourseDashboard from "./screens/CourseDashboard"
import SessionView from "./screens/SessionView"
import Bibliography from "./screens/Bibliography"
import ToolsLibrary from "./screens/ToolsLibrary"
import Labs from "./screens/Labs"
import ReportGenerator from "./screens/ReportGenerator"
import ToastNotification from "./components/ToastNotification"
import { useStore } from "./store/useStore"
import type { Course, Session } from "./types"

const allCourses = coursesData.courses as Course[]
const sessions   = sessionsData.sessions as Session[]

const COURSE_SESSIONS: Record<string, Session[]> = {
  "cybersecurity-banking-2026": sessions,
  "mobile-security-2026":       mobileSessions.sessions as Session[],
}

export default function App() {
  const { currentView, activeSessionId, activeCourseId, toastQueue } = useStore()

  const activeCourse  = allCourses.find((c) => c.id === activeCourseId) ?? allCourses[0]
  const courseSessions = COURSE_SESSIONS[activeCourse.id] ?? sessions
  const activeSession  = courseSessions.find((s) => s.id === activeSessionId) ?? courseSessions[0]

  // Keyboard shortcut: Space = play/pause timer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code !== "Space") return
      e.preventDefault()
      const { startTimer, pauseTimer, resumeTimer, timer, activeBlockId } = useStore.getState()
      if (timer.isRunning)    pauseTimer()
      else if (timer.isPaused) resumeTimer()
      else if (activeBlockId)  startTimer(activeBlockId)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="min-h-screen bg-base text-slate-100 font-sans">
      {currentView === "home"        && <GeneralDashboard />}
      {currentView === "course"      && <CourseDashboard course={activeCourse} sessions={courseSessions} />}
      {currentView === "session"     && <SessionView session={activeSession} />}
      {currentView === "bibliography"&& <Bibliography sessions={courseSessions} />}
      {currentView === "tools"       && <ToolsLibrary sessions={courseSessions} />}
      {currentView === "labs"        && <Labs />}
      {currentView === "reports"     && <ReportGenerator />}

      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 min-w-[280px] max-w-sm">
        {toastQueue.map((toast) => (
          <ToastNotification key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  )
}
