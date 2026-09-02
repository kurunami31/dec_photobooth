export default function FrameOverlay({ selected, onSelect }) {
  const frames = [
    { id: 'none', name: 'None', preview: null },
    { 
      id: 'border', 
      name: 'Border',
      preview: (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <rect x="2" y="2" width="36" height="36" fill="none" stroke="#E53935" strokeWidth="2" />
        </svg>
      )
    },
    { 
      id: 'rounded', 
      name: 'Rounded',
      preview: (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <rect x="2" y="2" width="36" height="36" rx="4" fill="none" stroke="#E53935" strokeWidth="2" />
        </svg>
      )
    },
    { 
      id: 'double', 
      name: 'Double',
      preview: (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <rect x="2" y="2" width="36" height="36" fill="none" stroke="#E53935" strokeWidth="1.5" />
          <rect x="5" y="5" width="30" height="30" fill="none" stroke="#E53935" strokeWidth="1.5" />
        </svg>
      )
    },
    { 
      id: 'corners', 
      name: 'Corners',
      preview: (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <path d="M4 12 L4 4 L12 4" fill="none" stroke="#E53935" strokeWidth="2" />
          <path d="M28 4 L36 4 L36 12" fill="none" stroke="#E53935" strokeWidth="2" />
          <path d="M4 28 L4 36 L12 36" fill="none" stroke="#E53935" strokeWidth="2" />
          <path d="M28 36 L36 36 L36 28" fill="none" stroke="#E53935" strokeWidth="2" />
        </svg>
      )
    },
    { 
      id: 'gradient', 
      name: 'Gradient',
      preview: (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E53935" />
              <stop offset="100%" stopColor="#C62828" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="36" height="36" fill="none" stroke="url(#grad)" strokeWidth="3" />
        </svg>
      )
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {frames.map((frame) => (
        <button
          key={frame.id}
          onClick={() => onSelect(frame.id)}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
            selected === frame.id
              ? 'bg-brand-red/10 border border-brand-red/30'
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="w-10 h-10">
            {frame.preview || (
              <div className="w-full h-full rounded bg-white/10" />
            )}
          </div>
          <span className={`text-xs font-medium ${
            selected === frame.id ? 'text-brand-red' : 'text-gray-500'
          }`}>
            {frame.name}
          </span>
        </button>
      ))}
    </div>
  )
}
