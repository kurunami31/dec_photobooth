import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import CameraView from './components/camera/CameraView'
import Gallery from './components/gallery/Gallery'
import InstallPrompt from './components/ui/InstallPrompt'
import PWAUpdatePrompt from './components/ui/PWAUpdatePrompt'

function App() {
  const [currentView, setCurrentView] = useState('camera')
  const [photos, setPhotos] = useState([])
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)

  // Handle PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show install prompt after 30 seconds if not already installed
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

  // Check if running as installed PWA
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

  const addPhoto = (photoData) => {
    setPhotos((prev) => [photoData, ...prev])
  }

  const deletePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        photoCount={photos.length}
      />

      <main className="pt-16">
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

export default App
