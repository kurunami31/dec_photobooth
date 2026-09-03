import { useState, useEffect, useRef } from 'react'
import { Camera, CameraOff, CheckCircle, Smartphone, Zap, ZapOff } from 'lucide-react'
import Peer from 'peerjs'

export default function PhoneCameraPage() {
  const [status, setStatus] = useState('initializing')
  const [error, setError] = useState(null)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const peerRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const desktopPeerId = params.get('peer')

    if (!desktopPeerId) {
      setError('No connection code found. Please scan the QR code again.')
      setStatus('error')
      return
    }

    const connect = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 3840 },
            height: { ideal: 2160 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        })

        const track = stream.getVideoTracks()[0]
        const settings = track.getSettings()
        console.log('Phone camera resolution:', settings.width, 'x', settings.height)

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        setStatus('connecting')

        const peer = new Peer({
          host: '0.peerjs.com',
          port: 443,
          path: '/',
          debug: 1,
        })

        peer.on('open', () => {
          const call = peer.call(desktopPeerId, stream, {
            videoCodec: 'vp9',
            bandwidth: 10000,
          })
          if (call) {
            call.on('stream', () => {
              setStatus('connected')
            })
            call.on('close', () => {
              setStatus('connecting')
            })
            call.on('error', (err) => {
              console.error('Call error:', err)
            })
          }
        })

        peer.on('error', (err) => {
          console.error('PeerJS error:', err)
          setError('Could not connect to photobooth. Make sure it is open and try again.')
          setStatus('error')
        })

        peerRef.current = peer
      } catch (err) {
        console.error('Camera error:', err)
        setError('Could not access camera. Please allow camera permissions and try again.')
        setStatus('error')
      }
    }

    connect()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (peerRef.current) {
        peerRef.current.destroy()
      }
    }
  }, [])

  const toggleTorch = async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return
    const newState = !torchEnabled
    try {
      await track.applyConstraints({
        advanced: [{ torch: newState }],
      })
      setTorchEnabled(newState)
    } catch (err) {
      console.warn('Torch not available on this device')
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Camera Preview */}
      <div className="relative w-full max-w-sm mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-2xl bg-gray-900"
        />

        {/* Status overlay */}
        {status === 'connected' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-green-400 text-xs font-medium">Connected</span>
          </div>
        )}

        {/* Flash toggle */}
        {status === 'connected' && (
          <button
            onClick={toggleTorch}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/40 hover:bg-black/60 transition-all backdrop-blur-sm"
          >
            {torchEnabled ? (
              <Zap size={18} className="text-yellow-400" />
            ) : (
              <ZapOff size={18} className="text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* Status text */}
      <div className="text-center">
        {status === 'initializing' && (
          <div className="flex items-center gap-2 text-gray-400">
            <Camera size={18} className="animate-pulse" />
            <span className="text-sm">Starting camera...</span>
          </div>
        )}
        {status === 'connecting' && (
          <div className="flex items-center gap-2 text-gray-400">
            <Smartphone size={18} className="animate-pulse" />
            <span className="text-sm">Connecting to photobooth...</span>
          </div>
        )}
        {status === 'connected' && (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">Streaming to photobooth</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-red-400">
              <CameraOff size={18} />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white transition-all"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Keep screen awake notice */}
      <p className="text-gray-600 text-xs mt-8 text-center max-w-xs">
        Keep this page open while using the photobooth. Your phone camera is now streaming to the booth.
      </p>
    </div>
  )
}
