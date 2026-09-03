import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import CameraView from './components/camera/CameraView'
import Gallery from './components/gallery/Gallery'
import WelcomePage from './pages/WelcomePage'
import EmailCapturePage from './pages/EmailCapturePage'
import PhoneConnectPage from './pages/PhoneConnectPage'
import PhoneCameraPage from './pages/PhoneCameraPage'
import InstallPrompt from './components/ui/InstallPrompt'
import PWAUpdatePrompt from './components/ui/PWAUpdatePrompt'
import SharePage from './pages/SharePage'
import { PhoneCameraProvider, usePhoneCamera } from './contexts/PhoneCameraContext'
import { photoAPI, emailAPI } from './services/api'
import { savePhoto, getRecentPhotos, deletePhoto as dbDeletePhoto, markSynced, getPendingSync } from './services/db'
import { sendOrQueueEmail, processEmailQueue } from './services/emailQueue'
import toast from 'react-hot-toast'
import { WifiOff, RefreshCw } from 'lucide-react'

function OfflineBanner({ isOnline, pendingCount }) {
  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`fixed top-16 left-0 right-0 z-40 px-4 py-2.5 text-center text-sm font-medium transition-all ${
      isOnline
        ? 'bg-green-500/20 text-green-400 border-b border-green-500/20'
        : 'bg-yellow-500/20 text-yellow-400 border-b border-yellow-500/20'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            <span>Syncing {pendingCount} photo{pendingCount !== 1 ? 's' : ''}...</span>
          </>
        ) : (
          <>
            <WifiOff size={14} />
            <span>You're offline. Photos are saved locally and will sync when connection returns.</span>
          </>
        )}
      </div>
    </div>
  )
}

function AppContent({ onConnectPhone }) {
  const navigate = useNavigate()
  const { externalStream } = usePhoneCamera()
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
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingData()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync pending photos and emails when coming back online
  const syncPendingData = useCallback(async () => {
    try {
      const pending = await getPendingSync()
      setPendingCount(pending.length)

      for (const photo of pending) {
        try {
          const response = await photoAPI.save({
            image: photo.image,
            layout: photo.layout || 'classic',
            filters: photo.filters || {},
            frame: photo.frame || 'none',
            text: photo.text || null,
            session_id: photo.session_id,
          })
          if (response.success) {
            await markSynced(photo.id)
            setPhotos(prev => prev.map(p =>
              p.id === photo.id
                ? { ...p, synced: true, share_token: response.data.share_token }
                : p
            ))
          }
        } catch {
          // will retry next time
        }
      }

      const emailResult = await processEmailQueue()
      if (emailResult.sent > 0) {
        toast.success(`${emailResult.sent} email${emailResult.sent !== 1 ? 's' : ''} sent`)
      }

      const remaining = await getPendingSync()
      setPendingCount(remaining.length)
    } catch {
      // will retry on next online event
    }
  }, [])

  // Check pending count on mount
  useEffect(() => {
    getPendingSync().then(pending => setPendingCount(pending.length))
  }, [])

  // Process email queue when coming online
  useEffect(() => {
    if (isOnline) {
      processEmailQueue().then(result => {
        if (result.sent > 0) {
          toast.success(`${result.sent} email${result.sent !== 1 ? 's' : ''} sent`)
        }
      })
    }
  }, [isOnline])

  // Load photos — IndexedDB first, then server sync
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        // Load from local DB first (instant, works offline)
        const localPhotos = await getRecentPhotos(50)
        if (localPhotos.length > 0) {
          setPhotos(localPhotos)
          setIsLoadingPhotos(false)
        }

        // Then try to sync from server
        try {
          const response = await photoAPI.getRecent(50)
          if (response.success && response.data) {
            const serverPhotos = response.data.map((p) => ({
              id: p.id,
              image: p.image_url,
              share_token: p.share_token,
              layout: p.layout_type,
              filters: p.filters_applied,
              frame: p.frame_used,
              text: p.custom_text,
              timestamp: p.created_at,
              synced: true,
            }))

            // Merge: server photos take precedence, add any local-only photos
            setPhotos(prev => {
              const serverIds = new Set(serverPhotos.map(p => p.id))
              const localOnly = prev.filter(p => !serverIds.has(p.id))
              return [...serverPhotos, ...localOnly]
            })

            // Save server photos locally for offline access
            for (const p of serverPhotos) {
              await savePhoto({ ...p, synced: true })
            }
          }
        } catch {
          // Server unavailable — local photos are already loaded
        }
      } catch (err) {
        console.warn('Could not load photos:', err.message)
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
    const localId = `local-${Date.now()}`
    const photoRecord = {
      ...photoData,
      id: photoData.id || localId,
      timestamp: new Date().toISOString(),
      synced: false,
    }

    // Save to IndexedDB immediately
    await savePhoto(photoRecord)

    setPhotos((prev) => [photoRecord, ...prev])
    setSessionPhotos((prev) => [...prev, photoRecord])

    // Try to sync to server in background
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
        const syncedPhoto = {
          ...photoRecord,
          id: response.data.id,
          share_token: response.data.share_token,
          synced: true,
        }

        // Update in IndexedDB
        await savePhoto(syncedPhoto)

        // Update state
        setPhotos((prev) =>
          prev.map(p => p.id === photoRecord.id ? syncedPhoto : p)
        )
        setSessionPhotos((prev) =>
          prev.map(p => p.id === photoRecord.id ? syncedPhoto : p)
        )

        return syncedPhoto
      }
    } catch {
      // Will sync later — photo is safe in IndexedDB
    }

    const pending = await getPendingSync()
    setPendingCount(pending.length)

    return photoRecord
  }

  const finishSession = async () => {
    if (sessionPhotos.length === 0) return

    if (!userEmail) {
      setSessionPhotos([])
      navigate('/gallery')
      return
    }

    toast.loading('Processing your strips...')

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

      const compositeDataUrl = canvas.toDataURL('image/jpeg', 0.98)

      const result = await sendOrQueueEmail({
        to: userEmail,
        imageUrl: compositeDataUrl,
      })

      toast.dismiss()
      if (result.queued) {
        toast.success('Email queued — will send when online')
      } else {
        toast.success(`Sent to ${userEmail}`)
      }
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
      await dbDeletePhoto(id)
    } catch {
      // local delete already happened in state
    }

    try {
      await photoAPI.delete(id)
    } catch {
      // will sync later
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
      <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} />

      {currentView !== 'welcome' && currentView !== 'email' && (
        <Navbar
          currentView={currentView}
          setCurrentView={handleNavigate}
          photoCount={photos.length}
        />
      )}

      <main className={`${
        currentView !== 'welcome' && currentView !== 'email'
          ? 'pt-16' + (!isOnline || pendingCount > 0 ? ' mt-10' : '')
          : ''
      }`}>
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
            externalStream={externalStream}
            onConnectPhone={() => navigate('/connect')}
            isOnline={isOnline}
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

function AppRoutes() {
  const { peerId, roomCode, status, startPeer, cleanup } = usePhoneCamera()

  const handleConnectPhone = () => {
    startPeer()
    navigate('/connect')
  }

  return (
    <Routes>
      <Route path="/share/:token" element={<SharePage />} />
      <Route path="/phone" element={<PhoneCameraPage />} />
      <Route path="/connect" element={
        <PhoneConnectPage onBack={() => window.history.back()} />
      } />
      <Route path="*" element={<AppContent onConnectPhone={handleConnectPhone} />} />
    </Routes>
  )
}

function App() {
  return (
    <PhoneCameraProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </PhoneCameraProvider>
  )
}

export default App
