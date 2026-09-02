import { useState } from 'react'
import { Printer, Loader2, Check } from 'lucide-react'
import { getPrinter } from '../../services/printer'
import toast from 'react-hot-toast'

export default function PrintButton({ image, disabled = false, className = '' }) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [printSuccess, setPrintSuccess] = useState(false)

  const handlePrint = async () => {
    if (!image || isPrinting) return

    const printer = getPrinter()
    if (!printer.isConnected) {
      toast.error('Connect a printer first')
      return
    }

    setIsPrinting(true)
    setPrintSuccess(false)

    try {
      await printer.printImage(image, {
        density: 2,
        feedLines: 5,
      })

      setPrintSuccess(true)
      toast.success('Printed successfully')

      // Reset success state after delay
      setTimeout(() => setPrintSuccess(false), 2000)
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Failed to print. Check printer connection.')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <button
      onClick={handlePrint}
      disabled={disabled || isPrinting}
      className={`btn-secondary flex items-center justify-center gap-2 ${
        printSuccess ? 'bg-green-500/20 border-green-500/30 text-green-400' : ''
      } ${className}`}
    >
      {isPrinting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Printing...
        </>
      ) : printSuccess ? (
        <>
          <Check size={16} />
          Printed
        </>
      ) : (
        <>
          <Printer size={16} />
          Print
        </>
      )}
    </button>
  )
}
