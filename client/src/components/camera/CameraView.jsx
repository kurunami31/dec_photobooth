import { useState, useRef, useCallback, useEffect } from 'react'
import { 
  Camera, RotateCcw, Settings2, Zap, ZapOff, 
  CircleDot, Timer, LayoutGrid, ChevronDown, X, Usb, CheckCircle, Smartphone
} from 'lucide-react'
import toast from 'react-hot-toast'
import Countdown from './Countdown'
import PhotoStripEditor from '../editor/PhotoStripEditor'

const RESOLUTIONS = [
  { label: '720p', width: 1280, height: 720 },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '4K', width: 3840, height: 2160 },
]

export default function CameraView({ onPhotoCapture, sessionPhotoCount, onFinishSession, externalStream, onConnectPhone }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [availableCameras, setAvailableCameras] = useState([])
  const [selectedResolution, setSelectedResolution] = useState(RESOLUTIONS[1])
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [currentShot, setCurrentShot] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [shotsPerStrip, setShotsPerStrip] = useState(4)
  const [countdownDuration, setCountdownDuration] = useState(3)
  const [hasPermission, setHasPermission] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isExternalCamera, setIsExternalCamera] = useState(false)

  // Detect mobile device
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  // Enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')
      setAvailableCameras(videoDevices)
    } catch (err) {
      console.warn('Could not enumerate cameras:', err)
    }
  }, [])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // Build constraints based on selected device or facing mode
      const videoConstraints = {}

      if (selectedDeviceId) {
        videoConstraints.deviceId = { exact: selectedDeviceId }
      } else {
        videoConstraints.facingMode = facingMode
      }

      videoConstraints.width = { ideal: selectedResolution.width }
      videoConstraints.height = { ideal: selectedResolution.height }

      const constraints = {
        video: videoConstraints,
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      // After getting stream, enumerate devices to populate the list
      await enumerateCameras()
    } catch (error) {
      console.error('Camera error:', error)
      setHasPermission(false)
      toast.error('Could not access camera. Please check permissions.')
    }
  }, [facingMode, selectedDeviceId, selectedResolution, enumerateCameras])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  // Initialize camera on mount
  useEffect(() => {
    if (!externalStream) {
      startCamera()
      return () => stopCamera()
    }
  }, [facingMode, selectedDeviceId, selectedResolution])

  // Handle external stream from phone
  useEffect(() => {
    if (externalStream) {
      setIsExternalCamera(true)
      setHasPermission(true)
      setStream(externalStream)
      if (videoRef.current) {
        videoRef.current.srcObject = externalStream
      }
    }
  }, [externalStream])

  // Switch camera (front/back) - only for phones
  const switchCamera = () => {
    setSelectedDeviceId(null)
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  // Select a specific camera device
  const handleDeviceSelect = (deviceId) => {
    setSelectedDeviceId(deviceId)
  }

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Mirror if front camera and no external device selected
    if (facingMode === 'user' && !selectedDeviceId) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    // Draw video frame
    ctx.drawImage(video, 0, 0)

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.92)

    // Trigger haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50)
    }

    return imageData
  }, [facingMode, selectedDeviceId, isMobile])

  // Handle capture button click
  const handleCapture = async () => {
    if (isCountingDown || isCapturing) return

    setIsCountingDown(true)
  }

  // Countdown completed - capture photo
  const handleCountdownComplete = () => {
    setIsCountingDown(false)
    setIsCapturing(true)

    // Flash effect
    if (flashEnabled) {
      const flash = document.getElementById('flash-overlay')
      if (flash) {
        flash.style.opacity = '1'
        setTimeout(() => {
          flash.style.opacity = '0'
        }, 100)
      }
    }

    setTimeout(() => {
      const photoData = capturePhoto()
      if (!photoData) {
        toast.error('Failed to capture photo')
        setIsCapturing(false)
        return
      }

      const newPhoto = {
        id: Date.now(),
        data: photoData,
        timestamp: new Date().toISOString(),
      }

      setCapturedPhotos((prev) => [...prev, newPhoto])
      setCurrentShot((prev) => prev + 1)
      setIsCapturing(false)

      // If we've completed a strip
      if (currentShot + 1 >= shotsPerStrip) {
        setIsEditing(true)
        toast.success('Strip complete')
      } else {
        toast.success(`Shot ${currentShot + 1} of ${shotsPerStrip}`)
      }
    }, 100)
  }

  // Reset and start new strip
  const handleReset = () => {
    setCapturedPhotos([])
    setCurrentShot(0)
    setIsEditing(false)
  }

  // Save completed strip
  const handleSaveStrip = (stripData) => {
    const imageData = typeof stripData === 'string' ? stripData : stripData?.image || ''
    onPhotoCapture({
      id: Date.now(),
      image: imageData,
      photos: capturedPhotos,
      timestamp: new Date().toISOString(),
    })
    handleReset()
    toast.success('Saved to gallery')
  }

  // Check if an external camera device is selected
  const isExternalDevice = !!selectedDeviceId

  // Get the current camera label for display
  const getCurrentCameraLabel = () => {
    if (selectedDeviceId) {
      const cam = availableCameras.find((c) => c.deviceId === selectedDeviceId)
      return cam?.label || 'External Camera'
    }
    return isMobile ? (facingMode === 'user' ? 'Front Camera' : 'Back Camera') : 'Default Camera'
  }

  return (
    <div className="min-h-screen bg-brand-dark pb-24 md:pb-8">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      
      {/* Flash overlay */}
      <div 
        id="flash-overlay"
        className="fixed inset-0 bg-white z-40 pointer-events-none transition-opacity duration-100"
        style={{ opacity: 0 }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* Camera Section */}
        {!isEditing ? (
          <div className="flex flex-col items-center gap-6 md:gap-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                Photo Studio
              </h1>
              <p className="text-gray-500 text-sm md:text-base">
                {currentShot === 0 
                  ? `Ready to capture ${shotsPerStrip} shots`
                  : `${currentShot} of ${shotsPerStrip} captured`
                }
              </p>
              {isExternalCamera && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Usb size={14} className="text-brand-red" />
                  <span className="text-xs text-brand-red font-medium">{getCurrentCameraLabel()}</span>
                </div>
              )}
            </div>

            {/* Camera Preview */}
            <div className="relative w-full max-w-lg">
              {/* Camera Frame */}
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    facingMode === 'user' && !selectedDeviceId ? 'scale-x-[-1]' : ''
                  }`}
                />
                
                {/* Camera permission error */}
                {hasPermission === false && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-brand-red/10 flex items-center justify-center mb-4">
                      <Camera size={32} className="text-brand-red" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
                    <p className="text-gray-400 text-sm max-w-xs">
                      Please allow camera access in your browser settings to use the studio.
                    </p>
                  </div>
                )}

                {/* Loading state */}
                {hasPermission === null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="spinner" />
                  </div>
                )}

                {/* Shot indicator */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {Array.from({ length: shotsPerStrip }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        i < currentShot
                          ? 'w-8 bg-brand-red'
                          : i === currentShot
                          ? 'w-8 bg-white animate-pulse'
                          : 'w-4 bg-white/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Camera switch button - only show when no external camera */}
                {!isExternalCamera && (
                  <button
                    onClick={switchCamera}
                    className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/40 hover:bg-black/60 transition-all backdrop-blur-sm"
                    aria-label="Switch camera"
                  >
                    <RotateCcw size={18} className="text-white" />
                  </button>
                )}

                {/* Bottom controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  {/* Flash toggle */}
                  <button
                    onClick={() => setFlashEnabled(!flashEnabled)}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 transition-all backdrop-blur-sm"
                    aria-label="Toggle flash"
                  >
                    {flashEnabled ? (
                      <Zap size={18} className="text-yellow-400" />
                    ) : (
                      <ZapOff size={18} className="text-gray-400" />
                    )}
                  </button>

                  {/* Settings button */}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 transition-all backdrop-blur-sm"
                    aria-label="Settings"
                  >
                    <Settings2 size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden" 
                    onClick={() => setShowSettings(false)} 
                  />
                  <div className="fixed inset-x-0 top-12 bottom-0 md:static md:inset-auto md:-bottom-4 md:left-0 md:right-0 glass-strong md:rounded-2xl rounded-t-2xl p-5 z-50 md:z-10 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">Settings</h3>
                      <button 
                        onClick={() => setShowSettings(false)}
                        className="p-1 rounded-lg hover:bg-white/10"
                      >
                        <X size={16} className="text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="space-y-5">
                      {/* Camera Device Picker */}
                      {!isExternalCamera && availableCameras.length > 1 && (
                        <div>
                          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
                            <Camera size={14} />
                            Camera
                          </label>
                          <div className="space-y-1.5">
                            {availableCameras.map((cam) => (
                              <button
                                key={cam.deviceId}
                                onClick={() => handleDeviceSelect(cam.deviceId)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                                  selectedDeviceId === cam.deviceId
                                    ? 'bg-brand-red/10 text-brand-red border border-brand-red/20'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                                }`}
                              >
                                <Usb size={14} className="flex-shrink-0" />
                                <span className="truncate">{cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resolution */}
                      <div>
                        <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
                          <LayoutGrid size={14} />
                          Resolution
                        </label>
                        <div className="flex gap-2">
                          {RESOLUTIONS.map((res) => (
                            <button
                              key={res.label}
                              onClick={() => setSelectedResolution(res)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedResolution.label === res.label
                                  ? 'bg-brand-red text-white'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {res.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shots per strip */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-400 flex items-center gap-2">
                            <LayoutGrid size={14} />
                            Photos per strip
                          </label>
                          <span className="text-white font-medium">{shotsPerStrip}</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="6"
                          value={shotsPerStrip}
                          onChange={(e) => {
                            setShotsPerStrip(parseInt(e.target.value))
                            setCapturedPhotos([])
                            setCurrentShot(0)
                          }}
                          className="w-full accent-brand-red h-1"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>2</span>
                          <span>6</span>
                        </div>
                      </div>

                      {/* Countdown duration */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-400 flex items-center gap-2">
                            <Timer size={14} />
                            Countdown
                          </label>
                          <span className="text-white font-medium">{countdownDuration}s</span>
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 5].map((sec) => (
                            <button
                              key={sec}
                              onClick={() => setCountdownDuration(sec)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                countdownDuration === sec
                                  ? 'bg-brand-red text-white'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Connect Phone */}
                    {!isExternalCamera && onConnectPhone && (
                      <div className="pt-4 border-t border-white/5">
                        <button
                          onClick={onConnectPhone}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-red/10 hover:bg-brand-red/20 text-brand-red text-sm font-medium transition-all"
                        >
                          <Smartphone size={16} />
                          Connect Phone as Camera
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Use your phone as an external camera
                        </p>
                      </div>
                    )}

                    {/* Third-party camera apps info */}
                    {!isExternalCamera && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">External Camera Apps</p>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          You can also use third-party apps like{' '}
                          <span className="text-white font-medium">DroidCam</span>,{' '}
                          <span className="text-white font-medium">Iriun Webcam</span>, or{' '}
                          <span className="text-white font-medium">EpocCam</span> to connect your phone as a USB or WiFi camera. 
                          Install the app on both your phone and computer, and the camera will appear in the picker above.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Capture Button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleCapture}
                disabled={isCountingDown || !hasPermission || isCapturing}
                className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 hover:bg-white/15 transition-all duration-300 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed group"
                aria-label="Capture photo"
              >
                {/* Outer ring */}
                <span className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-white/30 transition-colors" />
                {/* Inner circle */}
                <span className="absolute inset-3 rounded-full bg-white group-hover:bg-gray-100 transition-colors shadow-lg" />
                {/* Center dot */}
                <span className="absolute inset-0 flex items-center justify-center">
                  <CircleDot size={24} className="text-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
              <p className="text-gray-500 text-sm font-medium">
                {currentShot === 0
                  ? 'Tap to begin'
                  : `${currentShot} / ${shotsPerStrip}`
                }
              </p>
            </div>

            {/* Captured photos preview */}
            {capturedPhotos.length > 0 && (
              <div className="w-full max-w-lg">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                  {capturedPhotos.map((photo, index) => (
                    <div key={photo.id} className="relative flex-shrink-0">
                      <img
                        src={photo.data}
                        alt={`Shot ${index + 1}`}
                        className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl border border-white/10"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-red text-white text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reset button */}
            {capturedPhotos.length > 0 && (
              <button
                onClick={handleReset}
                className="btn-ghost flex items-center gap-2 text-gray-400"
              >
                <RotateCcw size={16} />
                Start over
              </button>
            )}

            {/* Done button - shown between strips when session has photos */}
            {capturedPhotos.length === 0 && sessionPhotoCount > 0 && !isCountingDown && (
              <button
                onClick={onFinishSession}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Done ({sessionPhotoCount} {sessionPhotoCount === 1 ? 'strip' : 'strips'})
              </button>
            )}
          </div>
        ) : (
          /* Photo Strip Editor */
          <PhotoStripEditor
            photos={capturedPhotos}
            onSave={handleSaveStrip}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Countdown Overlay */}
      {isCountingDown && (
        <Countdown
          duration={countdownDuration}
          onComplete={handleCountdownComplete}
        />
      )}
    </div>
  )
}
