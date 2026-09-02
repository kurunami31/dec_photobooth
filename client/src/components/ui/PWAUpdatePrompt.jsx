import { RefreshCw } from 'lucide-react'

export default function PWAUpdatePrompt({ onUpdate }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-40">
      <div className="glass-strong rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center flex-shrink-0">
            <RefreshCw size={18} className="text-brand-red" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">Update Available</h4>
            <p className="text-xs text-gray-400 mb-2">
              A new version is ready
            </p>
            <button
              onClick={onUpdate}
              className="btn-primary text-xs py-2 w-full"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
