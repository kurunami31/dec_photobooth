import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import CameraView from './components/camera/CameraView'
import Gallery from './components/gallery/Gallery'
import WelcomePage from './pages/WelcomePage'
import EmailCapturePage from './pages/EmailCapturePage'
import InstallPrompt from './components/ui/InstallPrompt'
import PWAUpdatePrompt from './components/ui/PWAUpdatePrompt'
import SharePage from './pages/SharePage'
import { photoAPI, emailAPI } from './services/api'
import toast from 'react-hot-toast'

function AppContent() {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState(() => {
    return sessionStorage.getItem('dec_visited') ? 'camera' : 'welcome'
  })
  const [photos, setPhotos] = useState([])
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [sessionPhotos, setSessionPhotos] = useState([])

  // Load photos from backend on mount
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const response = await photoAPI.getRecent(50)
        if (response.success && response.data) {
          const formatted = response.data.map((p) => ({
            id: p.id,
            image: p.image_url,
            share_token: p.share_token,
            layout: p.layout_type,
            filters: p.filters_applied,
            frame: p.frame_used,
            text: p.custom_text,
            timestamp: p.created_at,
          }))
          setPhotos(formatted)
        }
      } catch (err) {
        console.warn('Could not load photos from server:', err.message)
      } finally {
        setIsLoadingPhotos(false)
      }
    }
    loadPhotos()
  }, [])

  // Handle PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          setShowInstallPrompt(true)
        }
      }, 30000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Handle PWA update
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdatePrompt(true)
      })
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Running as installed PWA')
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('Install outcome:', outcome)
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleUpdate = () => {
    window.location.reload()
  }

  const addPhoto = async (photoData) => {
    let savedPhoto = photoData

    // Save to backend
    try {
      const response = await photoAPI.save({
        image: photoData.image,
        layout: photoData.layout || 'classic',
        filters: photoData.filters || {},
        frame: photoData.frame || 'none',
        text: photoData.text || null,
        session_id: photoData.session_id,
      })

      if (response.success) {
        savedPhoto = {
          ...photoData,
          id: response.data.id,
          share_token: response.data.share_token,
        }
      }
    } catch (err) {
      console.warn('Could not save to server, saving locally:', err.message)
    }

    setPhotos((prev) => [savedPhoto, ...prev])
    setSessionPhotos((prev) => [...prev, savedPhoto])
    return savedPhoto
  }

  const finishSession = async () => {
    if (sessionPhotos.length === 0) return

    if (!userEmail) {
      setSessionPhotos([])
      navigate('/gallery')
      return
    }

    toast.loading('Sending your strips...')

    try {
      const stripImages = sessionPhotos
        .map((p) => p.image)
        .filter((img) => typeof img === 'string' && img.startsWith('data:'))

      if (stripImages.length === 0) {
        toast.dismiss()
        toast.error('No images to send')
        setSessionPhotos([])
        navigate('/gallery')
        return
      }

      // Stitch all strips vertically into one composite image
      const composite = await new Promise((resolve, reject) => {
        const imgs = []
        let loaded = 0

        stripImages.forEach((src, i) => {
          const img = new Image()
          img.onload = () => {
            imgs[i] = img
            loaded++
            if (loaded === stripImages.length) resolve(imgs)
          }
          img.onerror = () => {
            loaded++
            if (loaded === stripImages.length) resolve(imgs.filter(Boolean))
          }
          img.src = src
        })
      })

      if (composite.length === 0) {
        toast.dismiss()
        toast.error('Could not load images')
        setSessionPhotos([])
        navigate('/gallery')
        return
      }

      const padding = 24
      const gap = 16
      const maxWidth = Math.max(...composite.map((img) => img.width))
      const totalHeight = composite.reduce((sum, img) => sum + img.height, 0) + padding * 2 + gap * (composite.length - 1)

      const canvas = document.createElement('canvas')
      canvas.width = maxWidth + padding * 2
      canvas.height = totalHeight
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let y = padding
      composite.forEach((img, i) => {
        const x = padding + (maxWidth - img.width) / 2
        ctx.drawImage(img, x, y, img.width, img.height)
        y += img.height + (i < composite.length - 1 ? gap : 0)
      })

      const compositeDataUrl = canvas.toDataURL('image/jpeg', 0.92)

      await emailAPI.send({
        to: userEmail,
        imageUrl: compositeDataUrl,
      })

      toast.dismiss()
      toast.success(`Sent to ${userEmail}`)
    } catch (err) {
      toast.dismiss()
      console.warn('Session email failed:', err.message)
      toast.error('Could not send email. Try again from the gallery.')
    }

    setSessionPhotos([])
    navigate('/gallery')
  }

  const deletePhoto = async (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))

    try {
      await photoAPI.delete(id)
    } catch (err) {
      console.warn('Could not delete from server:', err.message)
    }
  }

  const handleNavigate = (view) => {
    setCurrentView(view)
    if (view === 'gallery') {
      navigate('/gallery')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {currentView !== 'welcome' && currentView !== 'email' && (
        <Navbar
          currentView={currentView}
          setCurrentView={handleNavigate}
          photoCount={photos.length}
        />
      )}

      <main className={currentView !== 'welcome' && currentView !== 'email' ? 'pt-16' : ''}>
        {currentView === 'welcome' && (
          <WelcomePage
            photos={photos}
            onStart={() => {
              setCurrentView('email')
            }}
            onViewGallery={() => {
              sessionStorage.setItem('dec_visited', 'true')
              setCurrentView('gallery')
            }}
          />
        )}
        {currentView === 'email' && (
          <EmailCapturePage
            onContinue={(email) => {
              setUserEmail(email)
              sessionStorage.setItem('dec_visited', 'true')
              setCurrentView('camera')
            }}
            onBack={() => setCurrentView('welcome')}
          />
        )}
        {currentView === 'camera' && (
          <CameraView
            onPhotoCapture={addPhoto}
            sessionPhotoCount={sessionPhotos.length}
            onFinishSession={finishSession}
          />
        )}
        {currentView === 'gallery' && (
          <Gallery
            photos={photos}
            onDelete={deletePhoto}
          />
        )}
      </main>

      {showInstallPrompt && (
        <InstallPrompt
          onInstall={handleInstall}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}

      {showUpdatePrompt && (
        <PWAUpdatePrompt onUpdate={handleUpdate} />
      )}

      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'glass',
          duration: 3000,
          style: {
            background: 'rgba(45, 45, 45, 0.9)',
            color: '#fff',
            borderRadius: '1rem',
            padding: '0.75rem 1rem',
          },
        }}
      />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/:token" element={<SharePage />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
