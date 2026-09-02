import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import CameraView from './components/camera/CameraView'
import Gallery from './components/gallery/Gallery'
import WelcomePage from './pages/WelcomePage'
import InstallPrompt from './components/ui/InstallPrompt'
import PWAUpdatePrompt from './components/ui/PWAUpdatePrompt'
import SharePage from './pages/SharePage'
import { photoAPI } from './services/api'

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
        const savedPhoto = {
          ...photoData,
          id: response.data.id,
          share_token: response.data.share_token,
        }
        setPhotos((prev) => [savedPhoto, ...prev])
        return savedPhoto
      }
    } catch (err) {
      console.warn('Could not save to server, saving locally:', err.message)
    }

    // Fallback: save locally
    setPhotos((prev) => [photoData, ...prev])
    return photoData
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
      {currentView !== 'welcome' && (
        <Navbar
          currentView={currentView}
          setCurrentView={handleNavigate}
          photoCount={photos.length}
        />
      )}

      <main className={currentView !== 'welcome' ? 'pt-16' : ''}>
        {currentView === 'welcome' && (
          <WelcomePage
            photos={photos}
            onStart={() => {
              sessionStorage.setItem('dec_visited', 'true')
              setCurrentView('camera')
            }}
            onViewGallery={() => {
              sessionStorage.setItem('dec_visited', 'true')
              setCurrentView('gallery')
            }}
          />
        )}
        {currentView === 'camera' && (
          <CameraView onPhotoCapture={addPhoto} />
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
