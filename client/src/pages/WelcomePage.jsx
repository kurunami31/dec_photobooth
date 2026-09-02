import { Camera, Palette, Share2, Image as ImageIcon, ChevronRight } from 'lucide-react'

export default function WelcomePage({ photos, onStart, onViewGallery }) {
  const recentPhotos = photos.slice(0, 6)

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-10">
          <div className="relative mb-8">
            <img
              src="/logo.png"
              alt="DEC"
              className="w-20 h-20 md:w-24 md:h-24 object-contain"
            />
            <div className="absolute inset-0 bg-brand-red/20 blur-2xl rounded-full" />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              DEC{' '}
              <span className="text-gradient">Photobooth</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-light">
              Capture moments, share instantly
            </p>
          </div>

          <button
            onClick={onStart}
            className="group btn-primary text-lg px-10 py-4 flex items-center gap-3"
          >
            <Camera size={22} />
            Start Capturing
            <ChevronRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* How It Works */}
        <div className="px-6 pb-10">
          <div className="max-w-lg mx-auto">
            <p className="text-center text-xs text-gray-600 uppercase tracking-widest mb-6">
              How it works
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto mb-3">
                  <Camera size={24} className="text-brand-red" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Capture</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Take 2 to 6 photos in sequence with a countdown timer
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                  <Palette size={24} className="text-purple-400" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Customize</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Choose layouts, filters, frames and backgrounds
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <Share2 size={24} className="text-blue-400" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Share</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Download, email, print or share via link
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Strips */}
        {recentPhotos.length > 0 && (
          <div className="px-6 pb-8">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-600 uppercase tracking-widest">
                  Recent strips
                </p>
                <button
                  onClick={onViewGallery}
                  className="text-xs text-brand-red hover:text-brand-red-light transition-colors flex items-center gap-1"
                >
                  View all
                  <ChevronRight size={12} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {recentPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={onViewGallery}
                    className="flex-shrink-0 w-20 h-28 rounded-xl overflow-hidden card-hover border border-white/5"
                  >
                    <img
                      src={photo.image}
                      alt="Photo strip"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {recentPhotos.length === 0 && (
          <div className="px-6 pb-8">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <ImageIcon size={24} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-500 mb-1">No strips yet</p>
              <p className="text-xs text-gray-600">
                Your captured photo strips will appear here
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-8 text-center">
          <p className="text-xs text-gray-700">Version 1.0</p>
        </div>
      </div>
    </div>
  )
}
