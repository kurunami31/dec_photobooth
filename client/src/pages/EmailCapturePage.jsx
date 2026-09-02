import { useState } from 'react'
import { Mail, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'

export default function EmailCapturePage({ onContinue, onBack }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      onContinue('')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    onContinue(email.trim())
  }

  const handleSkip = () => {
    onContinue('')
  }

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="px-6 pt-6">
          <button
            onClick={onBack}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-red/10 flex items-center justify-center">
              <Mail size={28} className="text-brand-red" />
            </div>
            <div className="absolute inset-0 bg-brand-red/10 blur-2xl rounded-full" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Where should we send your strip?
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              We will email you a copy after your session
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <div className="mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="you@example.com"
                className="input-field w-full text-center text-lg py-4"
                autoFocus
              />
              {error && (
                <p className="text-brand-red text-xs mt-2 text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="group btn-primary w-full text-base py-4 flex items-center justify-center gap-3"
            >
              Continue
              <ChevronRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full mt-3 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Skip for now
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 pb-8 text-center">
          <p className="text-xs text-gray-700">Version 1.0</p>
        </div>
      </div>
    </div>
  )
}
