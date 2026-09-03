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
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      {/* Fullscreen video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top bar overlay */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10">
        {/* Status badge */}
        {status === 'connected' && (
          <div className="flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm rounded-full px-2.5 py-1">
            <CheckCircle size={12} className="text-green-400" />
            <span className="text-green-400 text-xs font-medium">Connected</span>
          </div>
        )}
        {(status === 'initializing' || status === 'connecting') && (
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-white/70 text-xs">
              {status === 'initializing' ? 'Starting...' : 'Connecting...'}
            </span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm rounded-full px-2.5 py-1">
            <CameraOff size={12} className="text-red-400" />
            <span className="text-red-400 text-xs font-medium">Error</span>
          </div>
        )}

        {/* Torch button */}
        {status === 'connected' && (
          <button
            onClick={toggleTorch}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm active:scale-90 transition-transform"
          >
            {torchEnabled ? (
              <Zap size={18} className="text-yellow-400" />
            ) : (
              <ZapOff size={18} className="text-white/60" />
            )}
          </button>
        )}
      </div>

      {/* Bottom message */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        {status === 'error' && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-red-400 text-xs text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs"
            >
              Try again
            </button>
          </div>
        )}
        {status !== 'error' && (
          <p className="text-white/40 text-xs text-center">
            Keep this page open while using the photobooth
          </p>
        )}
      </div>
    </div>
  )
}
