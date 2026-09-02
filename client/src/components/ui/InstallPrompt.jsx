import { X, Download, Smartphone } from 'lucide-react'

export default function InstallPrompt({ onInstall, onDismiss }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-40">
      <div className="glass-strong rounded-2xl p-5 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="DEC" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">Install DEC Photobooth</h4>
            <p className="text-xs text-gray-400 mb-3">
              Add to your home screen for quick access and offline use
            </p>
            <div className="flex gap-2">
              <button
                onClick={onInstall}
                className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                Install
              </button>
              <button
                onClick={onDismiss}
                className="btn-ghost text-xs py-2 px-3"
              >
                Later
              </button>
            </div>
          </div>
        </div>

        {/* Platform hints */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-gray-500">
          <Smartphone size={12} />
          <span>Works on iOS, Android, and desktop</span>
        </div>
      </div>
    </div>
  )
}
