import { useState, useEffect } from 'react'

export default function Countdown({ duration, onComplete }) {
  const [count, setCount] = useState(duration)

  useEffect(() => {
    if (count <= 0) {
      onComplete()
      return
    }

    const timer = setTimeout(() => {
      setCount((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [count, onComplete])

  return (
    <div className="countdown-overlay">
      <div className="countdown-number text-[120px] md:text-[160px] font-bold text-white">
        {count > 0 ? count : '📸'}
      </div>
    </div>
  )
}
