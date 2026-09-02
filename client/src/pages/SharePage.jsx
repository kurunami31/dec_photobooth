import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, ArrowLeft, Loader2, AlertCircle, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { photoAPI } from '../services/api'

export default function SharePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const response = await photoAPI.getByShareToken(token)
        if (response.success) {
          setPhoto(response.data)
        } else {
          setError('Photo not found')
        }
      } catch (err) {
        if (err.response?.status === 410) {
          setError('This share link has expired')
        } else if (err.response?.status === 404) {
          setError('Photo not found or link is invalid')
        } else {
          setError('Failed to load photo')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPhoto()
  }, [token])

  const handleDownload = () => {
    if (!photo?.image_url) return
    const link = document.createElement('a')
    link.download = `dec-photobooth-${token}.jpg`
    link.href = photo.image_url
    link.click()
    toast.success('Downloaded')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-red mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading photo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-brand-red" />
          </div>
          <h1 className="text-xl font-bold mb-2">Oops!</h1>
          <p className="text-gray-500 text-sm mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <Camera size={16} />
            Open Photobooth
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="btn-ghost flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Open Photobooth</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight">Shared Strip</h1>
          <div className="w-24" />
        </div>

        {/* Photo */}
        <div className="flex justify-center">
          <div className="photo-strip p-2 rounded-2xl">
            <img
              src={photo.image_url}
              alt="Shared photo strip"
              className="max-w-full h-auto rounded-xl shadow-2xl"
            />
          </div>
        </div>

        {/* Info */}
        <div className="text-center mt-6 mb-4">
          <p className="text-gray-500 text-sm">
            Created {new Date(photo.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          {photo.custom_text && (
            <p className="text-white font-medium mt-2">{photo.custom_text}</p>
          )}
        </div>

        {/* Download Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleDownload}
            className="btn-primary flex items-center gap-2 px-8 py-3"
          >
            <Download size={18} />
            Download Strip
          </button>
        </div>

        {/* Branding */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center gap-2 text-gray-600 text-xs">
            <Camera size={12} />
            <span>Captured with DEC Photobooth</span>
          </div>
        </div>
      </div>
    </div>
  )
}
