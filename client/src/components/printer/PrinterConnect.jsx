import { useState, useEffect } from 'react'
import { Bluetooth, BluetoothConnected, BluetoothOff, Printer, AlertCircle } from 'lucide-react'
import { getPrinter } from '../../services/printer'
import toast from 'react-hot-toast'

export default function PrinterConnect({ onConnect }) {
  const [status, setStatus] = useState('disconnected') // disconnected, connecting, connected, error
  const [printerName, setPrinterName] = useState('')
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    setIsSupported(getPrinter().constructor.isSupported())
  }, [])

  const handleConnect = async () => {
    if (status === 'connected') {
      // Disconnect
      try {
        await getPrinter().disconnect()
        setStatus('disconnected')
        setPrinterName('')
        onConnect?.(false)
        toast.success('Printer disconnected')
      } catch (error) {
        toast.error('Failed to disconnect')
      }
      return
    }

    setStatus('connecting')
    
    try {
      const printer = getPrinter()
      
      printer.onStatusChange = (newStatus) => {
        if (newStatus === 'connected') {
          setStatus('connected')
        } else if (newStatus === 'disconnected') {
          setStatus('disconnected')
          setPrinterName('')
          onConnect?.(false)
        }
      }

      await printer.connect()
      const info = printer.getInfo()
      setPrinterName(info.name)
      onConnect?.(true)
      toast.success(`Connected to ${info.name}`)
    } catch (error) {
      console.error('Connection error:', error)
      setStatus('error')
      onConnect?.(false)
      
      if (error.message.includes('cancelled') || error.message.includes('not found')) {
        toast.error('Printer not found or connection cancelled')
      } else {
        toast.error('Failed to connect to printer')
      }
      
      // Reset status after delay
      setTimeout(() => setStatus('disconnected'), 2000)
    }
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <AlertCircle size={18} className="text-yellow-500 flex-shrink-0" />
        <p className="text-sm text-yellow-500">
          Bluetooth printing is not supported in this browser. Use Chrome on Android or Edge on desktop.
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={status === 'connecting'}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
        status === 'connected'
          ? 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/15'
          : status === 'connecting'
          ? 'bg-white/5 border border-white/10 opacity-70'
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        status === 'connected'
          ? 'bg-green-500/20'
          : status === 'error'
          ? 'bg-red-500/20'
          : 'bg-brand-red/10'
      }`}>
        {status === 'connected' ? (
          <BluetoothConnected size={20} className="text-green-400" />
        ) : status === 'connecting' ? (
          <div className="spinner" />
        ) : (
          <Bluetooth size={20} className="text-brand-red" />
        )}
      </div>
      
      <div className="text-left flex-1">
        <p className="font-medium text-sm">
          {status === 'connected'
            ? 'Connected'
            : status === 'connecting'
            ? 'Connecting...'
            : 'Connect Printer'}
        </p>
        <p className="text-xs text-gray-500">
          {status === 'connected'
            ? printerName || 'C19 Thermal Printer'
            : 'C19-Green Bluetooth Printer'}
        </p>
      </div>

      {status === 'connected' && (
        <Printer size={16} className="text-green-400" />
      )}
    </button>
  )
}
