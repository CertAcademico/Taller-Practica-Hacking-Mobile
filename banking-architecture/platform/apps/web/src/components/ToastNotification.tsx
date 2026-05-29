import { X } from "lucide-react"
import { useStore } from "@/store/useStore"
import type { Toast } from "@/types"

const COLORS: Record<Toast["type"], string> = {
  info:    "bg-blue-900  border-blue-600  text-blue-100",
  warning: "bg-amber-900 border-amber-600 text-amber-100",
  success: "bg-green-900 border-green-600 text-green-100",
  alert:   "bg-red-900   border-red-600   text-red-100",
}

export default function ToastNotification({ id, message, type }: Toast) {
  const dismissToast = useStore((s) => s.dismissToast)

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium animate-toast-in ${COLORS[type]}`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={() => dismissToast(id)} className="opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}
