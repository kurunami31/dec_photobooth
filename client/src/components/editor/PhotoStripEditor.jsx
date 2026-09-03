import { useState, useRef, useEffect } from 'react'
import { 
  Download, Share2, ArrowLeft, LayoutGrid, 
  Palette, Frame, Type, Sparkles, Printer, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import FilterPanel from './FilterPanel'
import FrameOverlay from './FrameOverlay'
import ShareModal from '../share/ShareModal'
import PrinterConnect from '../printer/PrinterConnect'
import { getPrinter } from '../../services/printer'

const LAYOUTS = [
  { id: 'classic', name: 'Classic', description: '4x1 vertical strip' },
  { id: 'grid', name: 'Grid', description: '2x2 layout' },
  { id: 'horizontal', name: 'Film Strip', description: 'Horizontal sequence' },
  { id: 'polaroid', name: 'Polaroid', description: 'Instant style' },
]

const BACKGROUNDS = [
  // Solid Colors
  { id: 'white', name: 'Clean', category: 'solid', color: '#ffffff' },
  { id: 'black', name: 'Dark', category: 'solid', color: '#1a1a1a' },
  { id: 'cream', name: 'Warm', category: 'solid', color: '#f5f0e8' },
  { id: 'gray', name: 'Gray', category: 'solid', color: '#3d3d3d' },
  { id: 'offwhite', name: 'Ivory', category: 'solid', color: '#f8f8f8' },
  
  // Gradients
  { id: 'gradient-red', name: 'Brand', category: 'gradient', gradient: 'linear-gradient(135deg, #E53935, #C62828)' },
  { id: 'gradient-dark', name: 'Slate', category: 'gradient', gradient: 'linear-gradient(135deg, #2d2d2d, #1a1a1a)' },
  { id: 'gradient-blue', name: 'Ocean', category: 'gradient', gradient: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)' },
  { id: 'gradient-sunset', name: 'Sunset', category: 'gradient', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 'gradient-aurora', name: 'Aurora', category: 'gradient', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 'gradient-ocean', name: 'Teal', category: 'gradient', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { id: 'gradient-fire', name: 'Fire', category: 'gradient', gradient: 'linear-gradient(135deg, #f12711, #f5af19)' },

  // Cute Gradients
  { id: 'cute-candy', name: 'Candy', category: 'cute', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
  { id: 'cute-lavender', name: 'Lavender', category: 'cute', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { id: 'cute-mint', name: 'Mint', category: 'cute', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
  { id: 'cute-peachy', name: 'Peachy', category: 'cute', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 'cute-babyblue', name: 'Sky', category: 'cute', gradient: 'linear-gradient(135deg, #89f7fe, #66a6ff)' },
  { id: 'cute-rose', name: 'Rose', category: 'cute', gradient: 'linear-gradient(135deg, #fda085, #f6d365)' },
  { id: 'cute-cotton', name: 'Cotton', category: 'cute', gradient: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)' },
  { id: 'cute-lemonade', name: 'Lemon', category: 'cute', gradient: 'linear-gradient(135deg, #fddb92, #d1fdff)' },
  { id: 'cute-berry', name: 'Berry', category: 'cute', gradient: 'linear-gradient(135deg, #c471f5, #fa71cd)' },
  { id: 'cute-sakura', name: 'Sakura', category: 'cute', gradient: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)' },
]

const PATTERNS = [
  // No pattern
  { id: 'none', name: 'None', category: 'none', pattern: null },
  
  // Geometric Patterns
  { id: 'geo-dots', name: 'Dots', category: 'geometric', pattern: 'dots' },
  { id: 'geo-lines', name: 'Lines', category: 'geometric', pattern: 'lines' },
  { id: 'geo-grid', name: 'Grid', category: 'geometric', pattern: 'grid' },
  { id: 'geo-diagonal', name: 'Diagonal', category: 'geometric', pattern: 'diagonal' },
  { id: 'geo-crosshatch', name: 'Cross', category: 'geometric', pattern: 'crosshatch' },
  { id: 'geo-triangles', name: 'Triangles', category: 'geometric', pattern: 'triangles' },
  { id: 'geo-hexagons', name: 'Hexagon', category: 'geometric', pattern: 'hexagons' },
  { id: 'geo-diamonds', name: 'Diamond', category: 'geometric', pattern: 'diamonds' },
  { id: 'geo-circles', name: 'Circles', category: 'geometric', pattern: 'circles' },
  { id: 'geo-zigzag', name: 'Zigzag', category: 'geometric', pattern: 'zigzag' },
  { id: 'geo-waves', name: 'Waves', category: 'geometric', pattern: 'waves' },
  { id: 'geo-starburst', name: 'Burst', category: 'geometric', pattern: 'starburst' },

  // Cute Patterns
  { id: 'cute-hearts', name: 'Hearts', category: 'cute', pattern: 'hearts' },
  { id: 'cute-stars', name: 'Stars', category: 'cute', pattern: 'stars' },
  { id: 'cute-confetti', name: 'Confetti', category: 'cute', pattern: 'confetti' },
  { id: 'cute-sparkles', name: 'Sparkles', category: 'cute', pattern: 'sparkles' },
  { id: 'cute-bubbles', name: 'Bubbles', category: 'cute', pattern: 'bubbles' },
  { id: 'cute-clouds', name: 'Clouds', category: 'cute', pattern: 'clouds' },
  { id: 'cute-flowers', name: 'Flowers', category: 'cute', pattern: 'flowers' },
]

const DARK_BACKGROUNDS = new Set(['black', 'gray', 'gradient-dark', 'gradient-blue'])

const isBackgroundDark = (bg) => {
  if (!bg) return false
  if (DARK_BACKGROUNDS.has(bg.id)) return true
  if (bg.gradient) {
    const colors = bg.gradient.match(/#[a-fA-F0-9]+/g)
    if (colors && colors.length >= 2) {
      const lum1 = getLuminance(colors[0])
      const lum2 = getLuminance(colors[1])
      return (lum1 + lum2) / 2 < 0.4
    }
  }
  if (bg.color) return getLuminance(bg.color) < 0.4
  return false
}

const getLuminance = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

export default function PhotoStripEditor({ photos, onSave, onReset }) {
  const canvasRef = useRef(null)
  const [selectedLayout, setSelectedLayout] = useState('classic')
  const [selectedFilter, setSelectedFilter] = useState('none')
  const [selectedFrame, setSelectedFrame] = useState('none')
  const [selectedBackground, setSelectedBackground] = useState('white')
  const [selectedPattern, setSelectedPattern] = useState('none')
  const [customText, setCustomText] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showFrames, setShowFrames] = useState(false)
  const [showBackgrounds, setShowBackgrounds] = useState(false)
  const [showPatterns, setShowPatterns] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [generatedStrip, setGeneratedStrip] = useState(null)
  const [printerConnected, setPrinterConnected] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Generate photo strip
  useEffect(() => {
    generateStrip()
  }, [selectedLayout, selectedFilter, selectedFrame, selectedBackground, selectedPattern, customText])

  const generateStrip = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const imgWidth = 400
    const padding = 36
    const gap = 16

    // Calculate dimensions based on layout
    let stripWidth, stripHeight, photoWidth, photoHeight

    switch (selectedLayout) {
      case 'classic':
        stripWidth = imgWidth
        photoWidth = imgWidth - padding * 2
        photoHeight = photoWidth * 1.3
        stripHeight = (photoHeight + gap) * photos.length + padding * 2 + 100
        break
      case 'grid':
        stripWidth = imgWidth
        photoWidth = (imgWidth - padding * 2 - gap) / 2
        photoHeight = photoWidth * 1.3
        stripHeight = (photoHeight + gap) * 2 + padding * 2 + 100
        break
      case 'horizontal':
        stripWidth = imgWidth * 1.5
        photoWidth = (stripWidth - padding * 2 - gap * (photos.length - 1)) / photos.length
        photoHeight = photoWidth * 1.3
        stripHeight = photoHeight + padding * 2 + 100
        break
      case 'polaroid':
        stripWidth = imgWidth
        photoWidth = imgWidth - padding * 3
        photoHeight = photoWidth * 1.2
        stripHeight = (photoHeight + gap + 40) * photos.length + padding * 2 + 100
        break
      default:
        stripWidth = imgWidth
        photoWidth = imgWidth - padding * 2
        photoHeight = photoWidth * 1.3
        stripHeight = (photoHeight + gap) * photos.length + padding * 2 + 100
    }

    canvas.width = stripWidth
    canvas.height = stripHeight

    // Draw background
    const bg = BACKGROUNDS.find(b => b.id === selectedBackground)
    const pat = PATTERNS.find(p => p.id === selectedPattern)
    
    // Base fill
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
    
    // Draw pattern overlay
    if (pat?.pattern) {
      const dark = isBackgroundDark(bg)
      drawPattern(ctx, stripWidth, stripHeight, pat.pattern, dark)
    }

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

      // Draw photo preserving aspect ratio (cover mode)
      const radius = selectedLayout === 'polaroid' ? 4 : 8
      const imgRatio = img.width / img.height
      const slotRatio = photoWidth / photoHeight
      let sx, sy, sw, sh

      if (imgRatio > slotRatio) {
        sh = img.height
        sw = sh * slotRatio
        sx = (img.width - sw) / 2
        sy = 0
      } else {
        sw = img.width
        sh = sw / slotRatio
        sx = 0
        sy = (img.height - sh) / 2
      }

      ctx.save()
      ctx.beginPath()
      ctx.roundRect(x, y, photoWidth, photoHeight, radius)
      ctx.clip()
      ctx.drawImage(img, sx, sy, sw, sh, x, y, photoWidth, photoHeight)
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

    // Draw logo centered at bottom
    const logoSize = 48
    const logoX = (stripWidth - logoSize) / 2
    const logoY = stripHeight - 60

    ctx.globalAlpha = 1
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)

    // Store generated strip
    const stripData = canvas.toDataURL('image/jpeg', 0.98)
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

  // Draw geometric patterns on canvas
  const drawPattern = (ctx, width, height, pattern, isDark) => {
    ctx.save()
    
    const isCute = pattern === 'hearts' || pattern === 'stars' || pattern === 'confetti' || pattern === 'sparkles' || pattern === 'bubbles' || pattern === 'clouds' || pattern === 'flowers'

    let strokeColor, fillColor
    if (isCute) {
      strokeColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
      fillColor = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'
    } else {
      strokeColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
      fillColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
    }
    ctx.strokeStyle = strokeColor
    ctx.fillStyle = fillColor
    ctx.lineWidth = isCute ? 1.5 : 1

    const size = 30

    switch (pattern) {
      case 'hearts':
        for (let y = size; y < height; y += size * 1.8) {
          for (let x = size; x < width; x += size * 1.5) {
            const offsetX = (Math.floor(y / (size * 1.8)) % 2) * (size * 0.75)
            drawHeart(ctx, x + offsetX, y, size * 0.4)
          }
        }
        break

      case 'stars':
        for (let y = size; y < height; y += size * 2) {
          for (let x = size; x < width; x += size * 2) {
            const offsetX = (Math.floor(y / (size * 2)) % 2) * size
            drawStar(ctx, x + offsetX, y, size * 0.35, 5)
          }
        }
        break

      case 'confetti':
        const confettiColors = ['rgba(255,154,158,0.45)', 'rgba(254,207,239,0.45)', 'rgba(161,140,209,0.45)', 'rgba(137,247,254,0.45)', 'rgba(253,203,140,0.45)']
        for (let i = 0; i < 50; i++) {
          const cx = (i * 97 + 13) % width
          const cy = (i * 73 + 17) % height
          const cw = 4 + (i % 3) * 3
          const ch = 8 + (i % 4) * 3
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate((i * 1.2) % (Math.PI * 2))
          ctx.fillStyle = confettiColors[i % confettiColors.length]
          ctx.fillRect(-cw / 2, -ch / 2, cw, ch)
          ctx.restore()
        }
        break

      case 'sparkles':
        for (let y = size; y < height; y += size * 2.2) {
          for (let x = size; x < width; x += size * 2.2) {
            const sx = x + ((y / size) % 2 === 0 ? 0 : size)
            drawSparkle(ctx, sx, y, size * 0.3)
          }
        }
        break

      case 'bubbles':
        for (let y = size; y < height; y += size * 2) {
          for (let x = size; x < width; x += size * 2) {
            const offsetX = (Math.floor(y / (size * 2)) % 2) * size
            const r = 6 + ((x * y) % 5) * 2
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.arc(x + offsetX, y, r, 0, Math.PI * 2)
            ctx.stroke()
            ctx.globalAlpha = 0.3
            ctx.fill()
            ctx.globalAlpha = 1
          }
        }
        break

      case 'clouds':
        for (let y = size * 1.5; y < height; y += size * 3) {
          for (let x = size * 1.5; x < width; x += size * 4) {
            const ox = (Math.floor(y / (size * 3)) % 2) * (size * 2)
            drawCloud(ctx, x + ox, y, size * 0.8)
          }
        }
        break

      case 'flowers':
        for (let y = size * 1.5; y < height; y += size * 3) {
          for (let x = size * 1.5; x < width; x += size * 3) {
            const ox = (Math.floor(y / (size * 3)) % 2) * (size * 1.5)
            drawFlower(ctx, x + ox, y, size * 0.35)
          }
        }
        break

      case 'dots':
        for (let x = size / 2; x < width; x += size) {
          for (let y = size / 2; y < height; y += size) {
            ctx.beginPath()
            ctx.arc(x, y, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        break

      case 'lines':
        for (let i = -height; i < width + height; i += size) {
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i + height, height)
          ctx.stroke()
        }
        break

      case 'grid':
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
        for (let x = 0; x < width; x += size) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, height)
          ctx.stroke()
        }
        for (let y = 0; y < height; y += size) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(width, y)
          ctx.stroke()
        }
        break

      case 'diagonal':
        for (let i = -height; i < width + height; i += size) {
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i + height, height)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(i + size, 0)
          ctx.lineTo(i + size + height, height)
          ctx.stroke()
        }
        break

      case 'crosshatch':
        for (let i = -height; i < width + height; i += size) {
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i + height, height)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(i, height)
          ctx.lineTo(i + height, 0)
          ctx.stroke()
        }
        break

      case 'triangles':
        for (let y = 0; y < height; y += size) {
          for (let x = (y % (size * 2) === 0 ? 0 : size / 2); x < width; x += size) {
            ctx.beginPath()
            ctx.moveTo(x, y + size)
            ctx.lineTo(x + size / 2, y)
            ctx.lineTo(x + size, y + size)
            ctx.closePath()
            ctx.stroke()
          }
        }
        break

      case 'hexagons':
        const hexSize = size * 0.8
        for (let y = 0; y < height + hexSize; y += hexSize * 1.5) {
          for (let x = 0; x < width + hexSize; x += hexSize * 1.73) {
            const offsetX = (Math.floor(y / (hexSize * 1.5)) % 2) * (hexSize * 0.865)
            ctx.beginPath()
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i
              const hx = x + offsetX + hexSize * Math.cos(angle)
              const hy = y + hexSize * Math.sin(angle)
              if (i === 0) ctx.moveTo(hx, hy)
              else ctx.lineTo(hx, hy)
            }
            ctx.closePath()
            ctx.stroke()
          }
        }
        break

      case 'diamonds':
        for (let y = 0; y < height; y += size) {
          for (let x = 0; x < width; x += size) {
            ctx.beginPath()
            ctx.moveTo(x + size / 2, y)
            ctx.lineTo(x + size, y + size / 2)
            ctx.lineTo(x + size / 2, y + size)
            ctx.lineTo(x, y + size / 2)
            ctx.closePath()
            ctx.stroke()
          }
        }
        break

      case 'circles':
        for (let y = size; y < height; y += size * 2) {
          for (let x = size; x < width; x += size * 2) {
            ctx.beginPath()
            ctx.arc(x, y, size / 2 - 2, 0, Math.PI * 2)
            ctx.stroke()
          }
        }
        break

      case 'zigzag':
        for (let y = size / 2; y < height; y += size) {
          ctx.beginPath()
          let startX = 0
          ctx.moveTo(startX, y)
          for (let x = 0; x < width; x += size / 2) {
            ctx.lineTo(x + size / 4, y + (x % size === 0 ? size / 3 : -size / 3))
          }
          ctx.stroke()
        }
        break

      case 'waves':
        for (let y = size; y < height; y += size * 1.5) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          for (let x = 0; x < width; x += 5) {
            ctx.lineTo(x, y + Math.sin(x / 20) * 10)
          }
          ctx.stroke()
        }
        break

      case 'starburst':
        const centerX = width / 2
        const centerY = height / 2
        const rays = 24
        for (let i = 0; i < rays; i++) {
          const angle = (i / rays) * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(
            centerX + Math.cos(angle) * Math.max(width, height),
            centerY + Math.sin(angle) * Math.max(width, height)
          )
          ctx.stroke()
        }
        break
    }

    ctx.restore()
  }

  const drawHeart = (ctx, x, y, size) => {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, y + size * 0.3)
    ctx.bezierCurveTo(x, y - size * 0.5, x - size, y - size * 0.5, x - size, y + size * 0.1)
    ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size * 1.2)
    ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.6, x + size, y + size * 0.1)
    ctx.bezierCurveTo(x + size, y - size * 0.5, x, y - size * 0.5, x, y + size * 0.3)
    ctx.fill()
    ctx.restore()
  }

  const drawStar = (ctx, cx, cy, size, points) => {
    ctx.save()
    ctx.beginPath()
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2
      const r = i % 2 === 0 ? size : size * 0.4
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  const drawSparkle = (ctx, cx, cy, size) => {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cx, cy - size)
    ctx.bezierCurveTo(cx + size * 0.1, cy - size * 0.1, cx + size * 0.1, cy - size * 0.1, cx + size, cy)
    ctx.bezierCurveTo(cx + size * 0.1, cy + size * 0.1, cx + size * 0.1, cy + size * 0.1, cx, cy + size)
    ctx.bezierCurveTo(cx - size * 0.1, cy + size * 0.1, cx - size * 0.1, cy + size * 0.1, cx - size, cy)
    ctx.bezierCurveTo(cx - size * 0.1, cy - size * 0.1, cx - size * 0.1, cy - size * 0.1, cx, cy - size)
    ctx.fill()
    ctx.restore()
  }

  const drawCloud = (ctx, cx, cy, size) => {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2)
    ctx.arc(cx - size * 0.4, cy + size * 0.1, size * 0.35, 0, Math.PI * 2)
    ctx.arc(cx + size * 0.4, cy + size * 0.1, size * 0.4, 0, Math.PI * 2)
    ctx.arc(cx + size * 0.15, cy - size * 0.2, size * 0.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const drawFlower = (ctx, cx, cy, size) => {
    ctx.save()
    const petalCount = 5
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2
      const px = cx + Math.cos(angle) * size * 0.6
      const py = cy + Math.sin(angle) * size * 0.6
      ctx.beginPath()
      ctx.arc(px, py, size * 0.35, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const handleDownload = () => {
    if (!generatedStrip) return

    const link = document.createElement('a')
    link.download = `dec-photobooth-${Date.now()}.jpg`
    link.href = generatedStrip
    link.click()

    toast.success('Downloaded')
  }

  const [sharePhotoId, setSharePhotoId] = useState(null)

  const handleSave = async () => {
    if (!generatedStrip) return
    const saved = await onSave({
      image: generatedStrip,
      layout: selectedLayout,
      filters: selectedFilter,
      frame: selectedFrame,
      text: customText,
    })
    return saved
  }

  const handleShare = async () => {
    if (!generatedStrip) return
    // Save first to get a photoId and share_token
    const saved = await handleSave()
    if (saved?.share_token) {
      setSharePhotoId(saved.id)
    }
    setShowShareModal(true)
  }

  const handlePrint = async () => {
    if (!printerConnected || !generatedStrip) {
      toast.error('Connect a printer first')
      return
    }

    const printer = getPrinter()
    if (!printer.isConnected) {
      toast.error('Printer not connected')
      return
    }

    setIsPrinting(true)

    try {
      await printer.printImage(generatedStrip, {
        density: 2,
        feedLines: 5,
      })

      toast.success('Printed successfully')
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Failed to print')
    } finally {
      setIsPrinting(false)
    }
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
                setShowPatterns(false)
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
              <div className="mt-4 space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                {/* Solid Colors */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Colors</p>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUNDS.filter(b => b.category === 'solid').map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBackground(bg.id)}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          selectedBackground === bg.id
                            ? 'border-brand-red scale-105'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        style={{ background: bg.color }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Gradients */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Gradients</p>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUNDS.filter(b => b.category === 'gradient').map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBackground(bg.id)}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          selectedBackground === bg.id
                            ? 'border-brand-red scale-105'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        style={{ background: bg.gradient }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Cute Gradients */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Cute</p>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUNDS.filter(b => b.category === 'cute').map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBackground(bg.id)}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          selectedBackground === bg.id
                            ? 'border-brand-red scale-105'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        style={{ background: bg.gradient }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Patterns */}
          <div className="glass-card rounded-2xl p-5">
            <button
              onClick={() => {
                setShowPatterns(!showPatterns)
                setShowFilters(false)
                setShowFrames(false)
                setShowBackgrounds(false)
              }}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                Pattern
              </span>
              <span className="text-brand-red text-xs uppercase tracking-wider">
                {PATTERNS.find(p => p.id === selectedPattern)?.name}
              </span>
            </button>
            
            {showPatterns && (
              <div className="mt-4 space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                {/* Geometric Patterns */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Geometric</p>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setSelectedPattern('none')}
                      className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center ${
                        selectedPattern === 'none'
                          ? 'border-brand-red bg-brand-red/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                      title="None"
                    >
                      <span className="text-xs text-gray-400">None</span>
                    </button>
                    {PATTERNS.filter(p => p.category === 'geometric').map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPattern(p.id)}
                        className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center ${
                          selectedPattern === p.id
                            ? 'border-brand-red bg-brand-red/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                        title={p.name}
                      >
                        <span className="text-xs text-gray-400">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cute Patterns */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Cute</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PATTERNS.filter(p => p.category === 'cute').map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPattern(p.id)}
                        className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center ${
                          selectedPattern === p.id
                            ? 'border-brand-red scale-105 bg-white/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                        title={p.name}
                      >
                        <span className="text-xs text-gray-300">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
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
                setShowPatterns(false)
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
                setShowPatterns(false)
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

          {/* Printer Connection */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <Printer size={16} />
              Thermal Printer
            </h3>
            <PrinterConnect onConnect={setPrinterConnected} />
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

            {printerConnected && (
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="w-full btn-secondary flex items-center justify-center gap-2 py-4 bg-brand-red/10 border-brand-red/20 hover:bg-brand-red/20"
              >
                {isPrinting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer size={18} />
                    Print Strip
                  </>
                )}
              </button>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShare}
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
          photoId={sharePhotoId}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
