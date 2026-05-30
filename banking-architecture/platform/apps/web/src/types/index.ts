// ─── Tool ─────────────────────────────────────────────────────────────────────

export interface ToolGroup {
  name: string
  sector: string
  scenario: string
  source: string
}

export interface ToolQuestion {
  type: string
  text: string
}

export interface ToolSlide {
  type: string
  question: string
  options?: string[]
}

export interface ToolEscapeRoom {
  sala: number
  riddle: string
  context: string
}

export interface ToolTimeline {
  time: string
  action: string
}

export interface Tool {
  name: string
  url: string | null
  setup: string
  fields?: string[]
  timeline?: ToolTimeline[]
  questions?: (string | ToolQuestion)[]
  groups?: ToolGroup[]
  slides?: ToolSlide[]
  concepts?: string[]
  flashcardTopics?: string[]
  escapeRooms?: ToolEscapeRoom[]
  secondRound?: string
}

// ─── Case Study ───────────────────────────────────────────────────────────────

export interface CaseStudy {
  title: string
  narrative?: string
  profile?: string
  questions?: string[]
  matrix?: {
    headers: string[]
    rows: string[][]
  }
}

// ─── Block ────────────────────────────────────────────────────────────────────

export type BlockType =
  | "opening"
  | "lecture"
  | "activity"
  | "break"
  | "expert"
  | "autonomous"
  | "closing"

export interface Block {
  id: string
  start: string
  end: string
  duration: number
  title: string
  type: BlockType
  icon: string
  tool: Tool | null
  description: string
  keyActions: string[]
  speakerNote: string
  caseStudy?: CaseStudy
}

// ─── Pitch ────────────────────────────────────────────────────────────────────

export interface KeyCase {
  entity: string
  year: number
  fact: string
  source: string
}

export interface KeyStat {
  value: string
  label: string
  source: string
}

export interface Pitch {
  headline: string
  subheadline: string
  openingHook: string
  keyCases: KeyCase[]
  keyStats: KeyStat[]
  reflectionQuestion: string
  references: string[]
}

// ─── Expert Conference ────────────────────────────────────────────────────────

export interface ExpertConference {
  slot: string
  profileDesc: string
  format: string
  guidingQuestions: string[]
  secondRound: string | null
}

// ─── Readings ─────────────────────────────────────────────────────────────────

export interface Reading {
  title: string
  author: string
  url: string
  pages: string
}

export interface Readings {
  assigned: Reading[]
  toAssign: Reading[]
}

// ─── Session ──────────────────────────────────────────────────────────────────

export type SessionStatus = "active" | "upcoming" | "completed"

export interface Session {
  id: string
  number: number
  date: string
  dateLabel: string
  title: string
  shortTitle: string
  rectora: string
  color: string
  colorLight: string
  icon: string
  status: SessionStatus
  expertConference: ExpertConference | null
  pitch: Pitch
  blocks: Block[]
  readings: Readings
}

// ─── App State ────────────────────────────────────────────────────────────────

// ─── Course ───────────────────────────────────────────────────────────────────

export type CourseStatus = "active" | "coming-soon" | "planned" | "completed"

export interface Course {
  id: string
  slug: string
  title: string
  shortTitle: string
  description: string
  category: string
  level: string
  color: string
  colorLight: string
  icon: string
  status: CourseStatus
  instructor: string
  institution: string
  cohort: string
  totalSessions: number
  totalHours: number
  tags: string[]
  sessionsRef: string | null
}

// ─── Views ────────────────────────────────────────────────────────────────────

export type AppView = "home" | "course" | "session" | "bibliography" | "tools" | "labs" | "reports"

// ─── Reporting ────────────────────────────────────────────────────────────────

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "informational"
export type FindingStatus   = "open" | "in-progress" | "remediated" | "accepted-risk"

export interface Finding {
  id: string
  title: string
  severity: FindingSeverity
  status: FindingStatus
  cvss: string
  cve?: string
  ttp?: string          // MITRE ATT&CK TTP (ej: T1190)
  owasp?: string        // OWASP category (ej: A03:2021)
  affectedSystems: string
  description: string
  impact: string
  evidence: string
  remediation: string
  references: string
}

export interface Engagement {
  id: string
  title: string
  client: string
  tester: string
  startDate: string
  endDate: string
  scope: string
  methodology: string
  executiveSummary: string
  findings: Finding[]
}
export type ActiveTab = "blocks" | "pitch" | "readings" | "expert"

export interface TimerState {
  isRunning: boolean
  isPaused: boolean
  elapsed: number
  blockId: string | null
  alertAt: number[]
}

export interface Toast {
  id: string
  message: string
  type: "info" | "warning" | "success" | "alert"
  duration: number
}

export interface AppState {
  currentView: AppView
  activeCourseId: string | null
  activeSessionId: string
  activeBlockId: string | null
  sidebarOpen: boolean
  timer: TimerState
  expandedPitchSessionId: string | null
  expandedRefsSessionId: string | null
  activeTab: ActiveTab
  showAllSessions: boolean
  toastQueue: Toast[]
  completedBlocks: string[]
  assignedReadings: string[]
  checkedActions: string[]
}
