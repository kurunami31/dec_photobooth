import { createContext, useContext, useState, useRef, useCallback } from 'react'
import Peer from 'peerjs'

const PhoneCameraContext = createContext(null)

export function PhoneCameraProvider({ children }) {
  const [externalStream, setExternalStream] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [peerId, setPeerId] = useState(null)
  const [roomCode, setRoomCode] = useState(null)
  const [status, setStatus] = useState('idle')
  const peerRef = useRef(null)

  const startPeer = useCallback(() => {
    if (peerRef.current) return peerRef.current

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomCode(code)
    setStatus('initializing')

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
      call.answer(null, {
        bandwidth: 10000,
      })
      call.on('stream', (remoteStream) => {
        const track = remoteStream.getVideoTracks()[0]
        if (track) {
          const settings = track.getSettings()
          console.log('Received stream:', settings.width || 'unknown', 'x', settings.height || 'unknown', '| Label:', track.label)
        }
        setExternalStream(remoteStream)
        setIsConnected(true)
        setStatus('connected')
      })
      call.on('close', () => {
        setIsConnected(false)
        setExternalStream(null)
        setStatus('waiting')
      })
    })

    peer.on('error', (err) => {
      console.error('PeerJS error:', err)
      setStatus('error')
    })

    peerRef.current = peer
    return peer
  }, [])

  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
    setExternalStream(null)
    setIsConnected(false)
    setPeerId(null)
    setRoomCode(null)
    setStatus('idle')
  }, [])

  return (
    <PhoneCameraContext.Provider value={{
      externalStream,
      isConnected,
      peerId,
      roomCode,
      status,
      startPeer,
      cleanup,
    }}>
      {children}
    </PhoneCameraContext.Provider>
  )
}

export function usePhoneCamera() {
  const ctx = useContext(PhoneCameraContext)
  if (!ctx) throw new Error('usePhoneCamera must be used within PhoneCameraProvider')
  return ctx
}
