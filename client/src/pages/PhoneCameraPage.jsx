import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, CameraOff, CheckCircle, Smartphone, Zap, ZapOff } from 'lucide-react'
import Peer from 'peerjs'

export default function PhoneCameraPage() {
  const [status, setStatus] = useState('initializing')
  const [error, setError] = useState(null)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const peerRef = useRef(null)
  const statusRef = useRef('initializing')

  const updateStatus = useCallback((newStatus) => {
    statusRef.current = newStatus
    setStatus(newStatus)
  }, [])

  const toggleTorch = useCallback(async () => {
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
  }, [torchEnabled])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const desktopPeerId = params.get('peer')

    if (!desktopPeerId) {
      setError('No connection code found. Please scan the QR code again.')
      updateStatus('error')
      return
    }

    let destroyed = false

    const connect = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        })

        if (destroyed) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        const track = stream.getVideoTracks()[0]
        const settings = track.getSettings()
        console.log('Phone camera:', settings.width, 'x', settings.height, '|', track.label)

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        updateStatus('connecting')

        const peer = new Peer(undefined, {
          host: '0.peerjs.com',
          port: 443,
          path: '/',
          debug: 2,
        })

        peer.on('open', (id) => {
          console.log('Phone peer open:', id, '| calling:', desktopPeerId)
          if (destroyed) return

          updateStatus('connected')

          const call = peer.call(desktopPeerId, stream)
          if (call) {
            console.log('Call initiated')
            call.on('stream', (remoteStream) => {
              console.log('Received remote stream (unexpected on phone side)')
            })
            call.on('close', () => {
              console.log('Call closed')
              updateStatus('connecting')
            })
            call.on('error', (err) => {
              console.error('Call error:', err)
            })
          } else {
            console.error('Failed to initiate call')
          }
        })

        peer.on('disconnected', () => {
          console.log('Peer disconnected, reconnecting...')
          if (!peer.destroyed) {
            peer.reconnect()
          }
        })

        peer.on('error', (err) => {
          console.error('PeerJS error:', err)
          if (!destroyed) {
            setError('Connection failed. Make sure the photobooth is open and try again.')
            updateStatus('error')
          }
        })

        peerRef.current = peer
      } catch (err) {
        console.error('Camera error:', err)
        if (!destroyed) {
          setError('Could not access camera. Please allow camera permissions and try again.')
          updateStatus('error')
        }
      }
    }

    connect()

    return () => {
      destroyed = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }
    }
  }, [updateStatus])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-2xl bg-gray-900"
        />

        {status === 'connected' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-green-400 text-xs font-medium">Connected</span>
          </div>
        )}

        {status === 'connected' && (
          <button
            onClick={toggleTorch}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/40 hover:bg-black/60 transition-all backdrop-blur-sm active:scale-95"
          >
            {torchEnabled ? (
              <Zap size={18} className="text-yellow-400" />
            ) : (
              <ZapOff size={18} className="text-gray-400" />
            )}
          </button>
        )}
      </div>

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

      <p className="text-gray-600 text-xs mt-8 text-center max-w-xs">
        Keep this page open while using the photobooth. Your phone camera is now streaming to the booth.
      </p>
    </div>
  )
}
