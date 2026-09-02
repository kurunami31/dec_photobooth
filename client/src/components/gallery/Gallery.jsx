import { useState } from 'react'
import { 
  Download, Trash2, Share2, Mail, Calendar,
  ChevronLeft, X, Image as ImageIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import ShareModal from '../share/ShareModal'

export default function Gallery({ photos, onDelete }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)

  const handleDownload = (photo) => {
    const link = document.createElement('a')
    link.download = `dec-photobooth-${photo.id}.jpg`
    link.href = photo.image
    link.click()
    toast.success('Downloaded')
  }

  const handleDelete = (id) => {
    onDelete(id)
    setSelectedPhoto(null)
    toast.success('Deleted')
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Empty state
  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
            <ImageIcon size={32} className="text-gray-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">No photos yet</h2>
          <p className="text-gray-500 mb-6">
            Your captured photo strips will appear here
          </p>
          <button className="btn-primary">
            Start Capturing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gallery</h1>
            <p className="text-gray-500 text-sm mt-1">
              {photos.length} {photos.length === 1 ? 'strip' : 'strips'} captured
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer card-hover"
            >
              <img
                src={photo.image}
                alt={`Photo strip ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Calendar size={12} />
                    <span>{formatDate(photo.timestamp)}</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(photo)
                    }}
                    className="p-2 rounded-lg bg-black/50 hover:bg-brand-red transition-colors"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(photo.id)
                    }}
                    className="p-2 rounded-lg bg-black/50 hover:bg-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          {/* Close button */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Photo */}
          <div className="max-w-lg w-full mx-4">
            <img
              src={selectedPhoto.image}
              alt="Photo strip"
              className="w-full rounded-2xl shadow-2xl"
            />

            {/* Actions */}
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => handleDownload(selectedPhoto)}
                className="btn-primary flex items-center gap-2"
              >
                <Download size={18} />
                Download
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Share2 size={18} />
                Share
              </button>
              <button
                onClick={() => handleDelete(selectedPhoto.id)}
                className="btn-secondary flex items-center gap-2 text-red-400 hover:text-red-300"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>

            {/* Timestamp */}
            <p className="text-center text-gray-500 text-sm mt-4">
              {formatDate(selectedPhoto.timestamp)}
            </p>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedPhoto && (
        <ShareModal
          image={selectedPhoto.image}
          photoId={selectedPhoto.id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
