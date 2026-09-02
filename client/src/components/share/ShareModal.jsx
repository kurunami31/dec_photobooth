import { useState } from 'react'
import { X, Download, Mail, Link2, Check, Copy, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ShareModal({ image, onClose }) {
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.download = `dec-photobooth-${Date.now()}.jpg`
    link.href = image
    link.click()
    toast.success('Downloaded')
  }

  const handleCopyLink = async () => {
    try {
      // Convert base64 to blob
      const response = await fetch(image)
      const blob = await response.blob()
      
      // Create a temporary file URL
      const url = URL.createObjectURL(blob)
      
      // Try to copy the image to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/jpeg': blob })
      ])
      
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const response = await fetch(image)
        const blob = await response.blob()
        const file = new File([blob], 'dec-photobooth.jpg', { type: 'image/jpeg' })
        
        await navigator.share({
          title: 'DEC Photobooth',
          files: [file],
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Share cancelled')
        }
      }
    }
  }

  const handleEmailSend = async () => {
    if (!email) {
      toast.error('Enter an email address')
      return
    }

    setIsSending(true)
    
    // Simulate sending (would connect to backend)
    setTimeout(() => {
      setIsSending(false)
      toast.success('Email sent')
      setEmail('')
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md glass-strong rounded-t-3xl sm:rounded-3xl p-6 pb-8 safe-area-bottom">
        {/* Handle */}
        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Share Strip</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <img
            src={image}
            alt="Photo strip"
            className="w-full max-h-48 object-contain rounded-xl"
          />
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center flex-shrink-0">
              <Download size={20} className="text-brand-red" />
            </div>
            <div>
              <p className="font-medium">Download</p>
              <p className="text-sm text-gray-500">Save to your device</p>
            </div>
          </button>

          {/* Native Share (mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Share2 size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Share</p>
                <p className="text-sm text-gray-500">Send via apps on your device</p>
              </div>
            </button>
          )}

          {/* Copy to Clipboard */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              {copied ? (
                <Check size={20} className="text-green-400" />
              ) : (
                <Copy size={20} className="text-green-400" />
              )}
            </div>
            <div>
              <p className="font-medium">{copied ? 'Copied' : 'Copy'}</p>
              <p className="text-sm text-gray-500">Copy image to clipboard</p>
            </div>
          </button>

          {/* Email */}
          <div className="p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-gray-500">Send to yourself or a friend</p>
              </div>
            </div>
            <div className="flex gap-2 ml-15">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="input-field flex-1 text-sm py-2.5"
              />
              <button
                onClick={handleEmailSend}
                disabled={isSending}
                className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2"
              >
                {isSending ? (
                  <div className="spinner" />
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
