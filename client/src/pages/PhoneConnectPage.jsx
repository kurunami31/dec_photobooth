import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Smartphone, Copy, CheckCircle, ArrowLeft, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import Peer from 'peerjs'

export default function PhoneConnectPage({ onStreamReceived, onBack }) {
  const [peerId, setPeerId] = useState(null)
  const [roomCode, setRoomCode] = useState('')
  const [status, setStatus] = useState('initializing')
  const [copied, setCopied] = useState(false)
  const peerRef = useRef(null)

  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomCode(code)

    const peer = new Peer(`dec-booth-${code}`, {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      debug: 1,
    })

    peer.on('open', (id) => {
      setPeerId(id)
      setStatus('waiting')
    })

    peer.on('call', (call) => {
      call.answer()
      call.on('stream', (remoteStream) => {
        setStatus('connected')
        if (onStreamReceived) {
          onStreamReceived(remoteStream)
        }
      })
      call.on('close', () => {
        setStatus('waiting')
        toast.error('Phone disconnected')
      })
    })

    peer.on('error', (err) => {
      console.error('PeerJS error:', err)
      toast.error('Connection error. Please try again.')
    })

    peerRef.current = peer

    return () => {
      peer.destroy()
    }
  }, [onStreamReceived])

  const connectUrl = peerId
    ? `${window.location.origin}/phone?peer=${peerId}`
    : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(connectUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to camera</span>
        </button>

        <div className="glass-card rounded-2xl p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto mb-6">
            <Smartphone size={32} className="text-brand-red" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Connect Your Phone</h1>
          <p className="text-gray-400 text-sm mb-8">
            Scan the QR code with your phone's camera to use it as an external camera
          </p>

          {/* QR Code */}
          {peerId ? (
            <div className="bg-white rounded-2xl p-6 inline-block mb-6">
              <QRCodeSVG
                value={connectUrl}
                size={200}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="M"
                includeMargin={false}
              />
            </div>
          ) : (
            <div className="w-[200px] h-[200px] bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="spinner" />
            </div>
          )}

          {/* Room Code */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Room Code</p>
            <p className="text-3xl font-mono font-bold tracking-[0.3em] text-white">
              {roomCode}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {status === 'connected' ? (
              <>
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-400 text-sm font-medium">Phone connected!</span>
              </>
            ) : (
              <>
                <Wifi size={16} className="text-gray-400 animate-pulse" />
                <span className="text-gray-400 text-sm">Waiting for phone to connect...</span>
              </>
            )}
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm text-gray-300"
          >
            {copied ? (
              <>
                <CheckCircle size={16} className="text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy link instead
              </>
            )}
          </button>

          {/* Instructions */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">How it works</p>
            <ol className="text-left text-sm text-gray-400 space-y-2">
              <li className="flex gap-3">
                <span className="text-brand-red font-bold">1.</span>
                Open your phone's camera app
              </li>
              <li className="flex gap-3">
                <span className="text-brand-red font-bold">2.</span>
                Point at the QR code to scan it
              </li>
              <li className="flex gap-3">
                <span className="text-brand-red font-bold">3.</span>
                Tap the link to open and allow camera access
              </li>
              <li className="flex gap-3">
                <span className="text-brand-red font-bold">4.</span>
                Your phone camera will appear on screen
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
