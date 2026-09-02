import { useState, useRef, useEffect } from 'react'
import { 
  Download, Share2, ArrowLeft, LayoutGrid, 
  Palette, Frame, Type, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import FilterPanel from './FilterPanel'
import FrameOverlay from './FrameOverlay'
import ShareModal from '../share/ShareModal'

const LAYOUTS = [
  { id: 'classic', name: 'Classic', description: '4x1 vertical strip' },
  { id: 'grid', name: 'Grid', description: '2x2 layout' },
  { id: 'horizontal', name: 'Film Strip', description: 'Horizontal sequence' },
  { id: 'polaroid', name: 'Polaroid', description: 'Instant style' },
]

const BACKGROUNDS = [
  { id: 'white', name: 'Clean', color: '#ffffff' },
  { id: 'black', name: 'Dark', color: '#1a1a1a' },
  { id: 'cream', name: 'Warm', color: '#f5f0e8' },
  { id: 'gradient-red', name: 'Brand', gradient: 'linear-gradient(135deg, #E53935, #C62828)' },
  { id: 'gradient-dark', name: 'Slate', gradient: 'linear-gradient(135deg, #2d2d2d, #1a1a1a)' },
  { id: 'gradient-blue', name: 'Ocean', gradient: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)' },
]

export default function PhotoStripEditor({ photos, onSave, onReset }) {
  const canvasRef = useRef(null)
  const [selectedLayout, setSelectedLayout] = useState('classic')
  const [selectedFilter, setSelectedFilter] = useState('none')
  const [selectedFrame, setSelectedFrame] = useState('none')
  const [selectedBackground, setSelectedBackground] = useState('white')
  const [customText, setCustomText] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showFrames, setShowFrames] = useState(false)
  const [showBackgrounds, setShowBackgrounds] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [generatedStrip, setGeneratedStrip] = useState(null)

  // Generate photo strip
  useEffect(() => {
    generateStrip()
  }, [selectedLayout, selectedFilter, selectedFrame, selectedBackground, customText])

  const generateStrip = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const imgWidth = 400
    const padding = 24
    const gap = 12

    // Calculate dimensions based on layout
    let stripWidth, stripHeight, photoWidth, photoHeight

    switch (selectedLayout) {
      case 'classic':
        stripWidth = imgWidth
        photoWidth = imgWidth - padding * 2
        photoHeight = photoWidth * 0.8
        stripHeight = (photoHeight + gap) * photos.length + padding * 2 + 100
        break
      case 'grid':
        stripWidth = imgWidth
        photoWidth = (imgWidth - padding * 2 - gap) / 2
        photoHeight = photoWidth * 0.8
        stripHeight = (photoHeight + gap) * 2 + padding * 2 + 100
        break
      case 'horizontal':
        stripWidth = imgWidth * 1.5
        photoWidth = (stripWidth - padding * 2 - gap * (photos.length - 1)) / photos.length
        photoHeight = photoWidth * 0.8
        stripHeight = photoHeight + padding * 2 + 100
        break
      case 'polaroid':
        stripWidth = imgWidth
        photoWidth = imgWidth - padding * 3
        photoHeight = photoWidth
        stripHeight = (photoHeight + gap + 40) * photos.length + padding * 2 + 100
        break
      default:
        stripWidth = imgWidth
        photoWidth = imgWidth - padding * 2
        photoHeight = photoWidth * 0.8
        stripHeight = (photoHeight + gap) * photos.length + padding * 2 + 100
    }

    canvas.width = stripWidth
    canvas.height = stripHeight

    // Draw background
    const bg = BACKGROUNDS.find(b => b.id === selectedBackground)
    if (bg?.gradient) {
      const gradient = ctx.createLinearGradient(0, 0, stripWidth, stripHeight)
      const colors = bg.gradient.match(/#[a-fA-F0-9]+/g)
      gradient.addColorStop(0, colors[0])
      gradient.addColorStop(1, colors[1])
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = bg?.color || '#ffffff'
    }
    ctx.fillRect(0, 0, stripWidth, stripHeight)

    // Load and draw photos
    const loadPromises = photos.map((photo, index) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve({ img, index })
        img.src = photo.data
      })
    })

    const loadedImages = await Promise.all(loadPromises)
    loadedImages.sort((a, b) => a.index - b.index)

    // Apply filter
    const getFilterString = () => {
      switch (selectedFilter) {
        case 'grayscale': return 'grayscale(100%)'
        case 'sepia': return 'sepia(100%)'
        case 'vintage': return 'sepia(30%) contrast(110%) brightness(95%)'
        case 'cool': return 'saturate(90%) hue-rotate(15deg)'
        case 'warm': return 'saturate(110%) hue-rotate(-10deg) brightness(105%)'
        case 'high-contrast': return 'contrast(140%)'
        case 'bright': return 'brightness(115%)'
        case 'film': return 'contrast(110%) saturate(80%) brightness(95%)'
        default: return 'none'
      }
    }

    ctx.filter = getFilterString()

    // Draw photos based on layout
    loadedImages.forEach(({ img }, index) => {
      let x, y

      switch (selectedLayout) {
        case 'classic':
          x = padding
          y = padding + index * (photoHeight + gap)
          break
        case 'grid':
          x = padding + (index % 2) * (photoWidth + gap)
          y = padding + Math.floor(index / 2) * (photoHeight + gap)
          break
        case 'horizontal':
          x = padding + index * (photoWidth + gap)
          y = padding
          break
        case 'polaroid':
          x = padding + (stripWidth - photoWidth - padding * 3) / 2 + padding
          y = padding + index * (photoHeight + gap + 40)
          break
        default:
          x = padding
          y = padding + index * (photoHeight + gap)
      }

      // Draw rounded photo
      const radius = selectedLayout === 'polaroid' ? 4 : 8
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(x, y, photoWidth, photoHeight, radius)
      ctx.clip()
      ctx.drawImage(img, x, y, photoWidth, photoHeight)
      ctx.restore()
    })

    // Reset filter for decorations
    ctx.filter = 'none'

    // Draw frame overlay
    if (selectedFrame !== 'none') {
      drawFrame(ctx, stripWidth, stripHeight, selectedFrame)
    }

    // Draw custom text
    if (customText) {
      ctx.fillStyle = bg?.color === '#1a1a1a' || bg?.gradient ? '#ffffff' : '#333333'
      ctx.font = '600 14px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(customText, stripWidth / 2, stripHeight - 35)
    }

    // Draw logo
    const logo = new Image()
    logo.src = '/logo.png'
    await new Promise((resolve) => {
      logo.onload = resolve
      logo.onerror = resolve
    })

    // Draw small logo at bottom
    const logoSize = 24
    const logoX = padding
    const logoY = stripHeight - 48
    
    ctx.globalAlpha = 0.6
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
    ctx.globalAlpha = 1

    // Store generated strip
    const stripData = canvas.toDataURL('image/jpeg', 0.95)
    setGeneratedStrip(stripData)
  }

  const drawFrame = (ctx, width, height, frameType) => {
    switch (frameType) {
      case 'border':
        ctx.strokeStyle = '#E53935'
        ctx.lineWidth = 4
        ctx.strokeRect(8, 8, width - 16, height - 16)
        break
      case 'rounded':
        ctx.strokeStyle = '#E53935'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.roundRect(8, 8, width - 16, height - 16, 16)
        ctx.stroke()
        break
      case 'double':
        ctx.strokeStyle = '#E53935'
        ctx.lineWidth = 3
        ctx.strokeRect(8, 8, width - 16, height - 16)
        ctx.strokeRect(16, 16, width - 32, height - 32)
        break
      case 'corners':
        ctx.strokeStyle = '#E53935'
        ctx.lineWidth = 3
        const s = 24
        // Top left
        ctx.beginPath()
        ctx.moveTo(12, 12 + s)
        ctx.lineTo(12, 12)
        ctx.lineTo(12 + s, 12)
        ctx.stroke()
        // Top right
        ctx.beginPath()
        ctx.moveTo(width - 12 - s, 12)
        ctx.lineTo(width - 12, 12)
        ctx.lineTo(width - 12, 12 + s)
        ctx.stroke()
        // Bottom left
        ctx.beginPath()
        ctx.moveTo(12, height - 12 - s)
        ctx.lineTo(12, height - 12)
        ctx.lineTo(12 + s, height - 12)
        ctx.stroke()
        // Bottom right
        ctx.beginPath()
        ctx.moveTo(width - 12 - s, height - 12)
        ctx.lineTo(width - 12, height - 12)
        ctx.lineTo(width - 12, height - 12 - s)
        ctx.stroke()
        break
      case 'gradient':
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, '#E53935')
        gradient.addColorStop(1, '#C62828')
        ctx.strokeStyle = gradient
        ctx.lineWidth = 6
        ctx.strokeRect(6, 6, width - 12, height - 12)
        break
    }
  }

  const handleDownload = () => {
    if (!generatedStrip) return

    const link = document.createElement('a')
    link.download = `dec-photobooth-${Date.now()}.jpg`
    link.href = generatedStrip
    link.click()

    toast.success('Downloaded')
  }

  const handleSave = () => {
    if (!generatedStrip) return
    onSave(generatedStrip)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onReset}
          className="btn-ghost flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Camera</span>
        </button>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Edit Strip</h2>
        <div className="w-24" />
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Preview - Takes up more space */}
        <div className="lg:col-span-3 flex justify-center">
          <div className="sticky top-24">
            <div className="photo-strip p-2 rounded-2xl">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Layout Selection */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <LayoutGrid size={16} />
              Layout
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout.id)}
                  className={`layout-option flex-col items-start text-left ${
                    selectedLayout === layout.id ? 'active' : ''
                  }`}
                >
                  <span className="font-medium text-sm">{layout.name}</span>
                  <span className="text-xs text-gray-500">{layout.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Backgrounds */}
          <div className="glass-card rounded-2xl p-5">
            <button
              onClick={() => {
                setShowBackgrounds(!showBackgrounds)
                setShowFilters(false)
                setShowFrames(false)
              }}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Palette size={16} />
                Background
              </span>
              <span className="text-brand-red text-xs uppercase tracking-wider">
                {BACKGROUNDS.find(b => b.id === selectedBackground)?.name}
              </span>
            </button>
            
            {showBackgrounds && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBackground(bg.id)}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      selectedBackground === bg.id
                        ? 'border-brand-red scale-105'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    style={{
                      background: bg.gradient || bg.color,
                    }}
                  >
                    <span className="sr-only">{bg.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-5">
            <button
              onClick={() => {
                setShowFilters(!showFilters)
                setShowFrames(false)
                setShowBackgrounds(false)
              }}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                Filters
              </span>
              <span className="text-brand-red text-xs uppercase tracking-wider">
                {selectedFilter}
              </span>
            </button>
            
            {showFilters && (
              <div className="mt-4">
                <FilterPanel
                  selected={selectedFilter}
                  onSelect={setSelectedFilter}
                />
              </div>
            )}
          </div>

          {/* Frames */}
          <div className="glass-card rounded-2xl p-5">
            <button
              onClick={() => {
                setShowFrames(!showFrames)
                setShowFilters(false)
                setShowBackgrounds(false)
              }}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Frame size={16} />
                Frames
              </span>
              <span className="text-brand-red text-xs uppercase tracking-wider">
                {selectedFrame}
              </span>
            </button>
            
            {showFrames && (
              <div className="mt-4">
                <FrameOverlay
                  selected={selectedFrame}
                  onSelect={setSelectedFrame}
                />
              </div>
            )}
          </div>

          {/* Custom Text */}
          <div className="glass-card rounded-2xl p-5">
            <label className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Type size={16} />
              Caption
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Add a caption..."
              maxLength={40}
              className="input-field mt-2"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleDownload}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4"
            >
              <Download size={18} />
              Download Strip
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                onClick={handleSave}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                Save to Gallery
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          image={generatedStrip}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
