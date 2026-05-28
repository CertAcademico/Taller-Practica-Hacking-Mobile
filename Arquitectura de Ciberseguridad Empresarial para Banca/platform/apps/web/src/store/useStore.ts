import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AppState, AppView, ActiveTab, Toast } from "@/types"

const STORAGE_KEY = "cyberteach_state"

const defaultTimer = {
  isRunning: false,
  isPaused: false,
  elapsed: 0,
  blockId: null,
  alertAt: [0.75, 0.9, 1.0],
}

interface AppActions {
  navigate: (view: AppView, params?: Partial<AppState>) => void
  setActiveCourse: (id: string) => void
  setActiveSession: (id: string) => void
  setActiveBlock: (id: string | null) => void
  setActiveTab: (tab: ActiveTab) => void
  toggleSidebar: () => void

  // Timer
  startTimer: (blockId: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  tickTimer: () => void
  resetTimer: () => void
  completeBlock: (blockId: string) => void

  // Progress
  toggleReadingAssigned: (readingTitle: string) => void
  toggleActionChecked: (action: string) => void

  // Toast
  pushToast: (msg: string, type?: Toast["type"], duration?: number) => void
  dismissToast: (id: string) => void
}

export const useStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // ─── Initial state ──────────────────────────────────────────────────────
      currentView: "home",
      activeCourseId: null,
      activeSessionId: "s1",
      activeBlockId: null,
      sidebarOpen: true,
      timer: defaultTimer,
      expandedPitchSessionId: null,
      expandedRefsSessionId: null,
      activeTab: "blocks",
      showAllSessions: false,
      toastQueue: [],
      completedBlocks: [],
      assignedReadings: [],
      checkedActions: [],

      // ─── Navigation ─────────────────────────────────────────────────────────
      navigate: (view, params = {}) =>
        set((s) => ({ ...s, currentView: view, ...params })),

      setActiveCourse: (id: string) =>
        set({ activeCourseId: id, currentView: "course", activeBlockId: null }),

      setActiveSession: (id) =>
        set({ activeSessionId: id, activeBlockId: null, activeTab: "blocks" }),

      setActiveBlock: (id) => set({ activeBlockId: id }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // ─── Timer ──────────────────────────────────────────────────────────────
      startTimer: (blockId) =>
        set({
          timer: { ...defaultTimer, isRunning: true, blockId, elapsed: 0 },
          activeBlockId: blockId,
        }),

      pauseTimer: () =>
        set((s) => ({
          timer: { ...s.timer, isRunning: false, isPaused: true },
        })),

      resumeTimer: () =>
        set((s) => ({
          timer: { ...s.timer, isRunning: true, isPaused: false },
        })),

      tickTimer: () =>
        set((s) => ({
          timer: { ...s.timer, elapsed: s.timer.elapsed + 1 },
        })),

      resetTimer: () => set({ timer: defaultTimer }),

      completeBlock: (blockId) => {
        const { completedBlocks, pushToast } = get()
        if (!completedBlocks.includes(blockId)) {
          set({ completedBlocks: [...completedBlocks, blockId] })
        }
        set({ timer: defaultTimer, activeBlockId: null })
        pushToast("Bloque completado ✓", "success")
      },

      // ─── Progress ───────────────────────────────────────────────────────────
      toggleReadingAssigned: (title) =>
        set((s) => ({
          assignedReadings: s.assignedReadings.includes(title)
            ? s.assignedReadings.filter((r) => r !== title)
            : [...s.assignedReadings, title],
        })),

      toggleActionChecked: (action) =>
        set((s) => ({
          checkedActions: s.checkedActions.includes(action)
            ? s.checkedActions.filter((a) => a !== action)
            : [...s.checkedActions, action],
        })),

      // ─── Toast ──────────────────────────────────────────────────────────────
      pushToast: (message, type = "info", duration = 4000) => {
        const id = crypto.randomUUID()
        set((s) => ({ toastQueue: [...s.toastQueue, { id, message, type, duration }] }))
        setTimeout(() => get().dismissToast(id), duration)
      },

      dismissToast: (id) =>
        set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        completedBlocks: s.completedBlocks,
        assignedReadings: s.assignedReadings,
        checkedActions: s.checkedActions,
        activeSessionId: s.activeSessionId,
        activeCourseId: s.activeCourseId,
      }),
    }
  )
)
