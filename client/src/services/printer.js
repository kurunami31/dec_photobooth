// C19 Thermal Printer Bluetooth Service
// Uses Web Bluetooth API for BLE communication
// ESC/POS protocol variant for thermal printers

const PRINTER_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb'
const PRINTER_WRITE_UUID = '0000ff02-0000-1000-8000-00805f9b34fb'
const PRINTER_NOTIFY_UUID = '0000ff01-0000-1000-8000-00805f9b34fb'

// ESC/POS Commands
const COMMANDS = {
  // Initialize printer
  INIT: new Uint8Array([0x1B, 0x40]),
  // Enable printer (Lujiang/C19 specific)
  ENABLE: new Uint8Array([0x10, 0xFF, 0xF1, 0x03]),
  // Wake up (12 null bytes)
  WAKE: new Uint8Array(12),
  // Set density (0=light, 1=normal, 2=dark)
  DENSITY_NORMAL: new Uint8Array([0x10, 0xFF, 0x10, 0x00, 0x01]),
  // Feed paper 80 dots
  FEED: new Uint8Array([0x1B, 0x4A, 0x50]),
  // Cut paper (if supported)
  CUT: new Uint8Array([0x1D, 0x56, 0x01]),
  // Stop print job
  STOP: new Uint8Array([0x10, 0xFF, 0xF1, 0x45]),
}

class ThermalPrinter {
  constructor() {
    this.device = null
    this.server = null
    this.service = null
    this.writeCharacteristic = null
    this.notifyCharacteristic = null
    this.isConnected = false
    this.onStatusChange = null
  }

  // Check if Web Bluetooth is supported
  static isSupported() {
    return navigator.bluetooth !== undefined
  }

  // Connect to printer
  async connect() {
    if (!ThermalPrinter.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser')
    }

    try {
      // Request device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [PRINTER_SERVICE_UUID] },
          { namePrefix: 'C19' },
          { namePrefix: 'RongFast' },
          { namePrefix: 'MHT-' },
          { namePrefix: 'BLE' },
        ],
        optionalServices: [PRINTER_SERVICE_UUID],
      })

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false
        this.onStatusChange?.('disconnected')
      })

      // Connect to GATT server
      this.server = await this.device.gatt.connect()

      // Get service
      this.service = await this.server.getPrimaryService(PRINTER_SERVICE_UUID)

      // Get characteristics
      this.writeCharacteristic = await this.service.getCharacteristic(PRINTER_WRITE_UUID)
      this.notifyCharacteristic = await this.service.getCharacteristic(PRINTER_NOTIFY_UUID)

      // Enable notifications
      await this.notifyCharacteristic.startNotifications()
      this.notifyCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        this.handleNotification(event.target.value)
      })

      // Initialize printer
      await this.initPrinter()

      this.isConnected = true
      this.onStatusChange?.('connected')
      return true
    } catch (error) {
      console.error('Printer connection error:', error)
      this.isConnected = false
      this.onStatusChange?.('error')
      throw error
    }
  }

  // Disconnect from printer
  async disconnect() {
    if (this.device?.gatt.connected) {
      await this.sendCommand(COMMANDS.STOP)
      this.device.gatt.disconnect()
    }
    this.isConnected = false
    this.onStatusChange?.('disconnected')
  }

  // Handle notifications from printer
  handleNotification(value) {
    const data = new Uint8Array(value.buffer)
    // Check printer status
    if (data.length > 0) {
      const status = data[0]
      const isReady = (status & 0x01) === 0 // Bit 0: 0=ready, 1=busy
      const hasPaper = (status & 0x02) === 0 // Bit 1: 0=has paper, 1=no paper
      this.onStatusChange?.(isReady && hasPaper ? 'ready' : 'busy')
    }
  }

  // Initialize printer
  async initPrinter() {
    await this.sendCommand(COMMANDS.INIT)
    await this.sendCommand(COMMANDS.WAKE)
    await this.sleep(100)
    await this.sendCommand(COMMANDS.ENABLE)
    await this.sendCommand(COMMANDS.DENSITY_NORMAL)
    await this.sleep(100)
  }

  // Send command to printer
  async sendCommand(command) {
    if (!this.writeCharacteristic) {
      throw new Error('Printer not connected')
    }

    // Send in chunks (Web Bluetooth MTU limit ~20 bytes, but we use 100)
    const chunkSize = 100
    for (let i = 0; i < command.length; i += chunkSize) {
      const chunk = command.slice(i, i + chunkSize)
      await this.writeCharacteristic.writeValue(chunk)
      await this.sleep(50) // Delay between chunks
    }
  }

  // Print image (canvas element or image URL)
  async printImage(imageSource, options = {}) {
    const {
      density = 2,        // 0=light, 1=normal, 2=dark
      feedLines = 5,      // Lines to feed after printing
    } = options

    // Set density
    const densityCmd = new Uint8Array([0x10, 0xFF, 0x10, 0x00, density])
    await this.sendCommand(densityCmd)

    // Get image data
    const imageData = await this.processImage(imageSource)

    // Send raster image command
    // GS v 0 command for raster graphics
    const width = imageData.width
    const height = imageData.height

    // Calculate bytes per line (width / 8, rounded up)
    const bytesPerLine = Math.ceil(width / 8)

    // GS v 0 command: 0x1D 0x76 0x30 m xL xH yL yH d1...dk
    const header = new Uint8Array([
      0x1D, 0x76, 0x30, 0x00, // GS v 0 m=0 (normal)
      bytesPerLine & 0xFF,     // xL (width bytes low)
      (bytesPerLine >> 8) & 0xFF, // xH (width bytes high)
      height & 0xFF,           // yL (height low)
      (height >> 8) & 0xFF,    // yH (height high)
    ])

    // Combine header and image data
    const printData = new Uint8Array(header.length + imageData.data.length)
    printData.set(header)
    printData.set(imageData.data, header.length)

    // Send print data
    await this.sendCommand(printData)

    // Feed paper
    const feedCmd = new Uint8Array([0x1B, 0x4A, feedLines * 8])
    await this.sendCommand(feedCmd)
  }

  // Process image for thermal printing (convert to 1-bit B&W with dithering)
  async processImage(imageSource) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        // Target width for 57mm paper at 200 DPI = ~448 pixels
        // But C19 uses 384 pixels width
        const targetWidth = 384
        const scale = targetWidth / img.width
        const targetHeight = Math.floor(img.height * scale)

        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')

        // Draw scaled image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
        const pixels = imageData.data

        // Convert to grayscale
        const grayscale = new Uint8Array(targetWidth * targetHeight)
        for (let i = 0; i < pixels.length; i += 4) {
          const gray = Math.round(
            0.299 * pixels[i] +     // R
            0.587 * pixels[i + 1] + // G
            0.114 * pixels[i + 2]   // B
          )
          grayscale[i / 4] = gray
        }

        // Apply Floyd-Steinberg dithering
        const dithered = this.floydSteinbergDither(grayscale, targetWidth, targetHeight)

        // Convert to 1-bit packed bytes (MSB first)
        const bytesPerLine = Math.ceil(targetWidth / 8)
        const bitmapData = new Uint8Array(bytesPerLine * targetHeight)

        for (let y = 0; y < targetHeight; y++) {
          for (let x = 0; x < targetWidth; x++) {
            const idx = y * targetWidth + x
            const byteIdx = y * bytesPerLine + Math.floor(x / 8)
            const bitIdx = 7 - (x % 8) // MSB first

            if (dithered[idx] > 127) {
              bitmapData[byteIdx] |= (1 << bitIdx)
            }
          }
        }

        resolve({
          data: bitmapData,
          width: targetWidth,
          height: targetHeight,
        })
      }

      img.onerror = reject

      if (imageSource instanceof HTMLCanvasElement) {
        img.src = imageSource.toDataURL()
      } else if (imageSource instanceof HTMLImageElement) {
        img.src = imageSource.src
      } else if (typeof imageSource === 'string') {
        img.src = imageSource
      } else {
        reject(new Error('Invalid image source'))
      }
    })
  }

  // Floyd-Steinberg dithering algorithm
  floydSteinbergDither(grayscale, width, height) {
    const result = new Uint8Array(grayscale)
    const error = new Float32Array(grayscale)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        const oldPixel = result[idx] + error[idx]
        const newPixel = oldPixel > 127 ? 255 : 0
        result[idx] = newPixel

        const quantError = oldPixel - newPixel

        // Distribute error to neighboring pixels
        if (x + 1 < width) error[idx + 1] += quantError * 7 / 16
        if (y + 1 < height) {
          if (x - 1 >= 0) error[idx + width - 1] += quantError * 3 / 16
          error[idx + width] += quantError * 5 / 16
          if (x + 1 < width) error[idx + width + 1] += quantError * 1 / 16
        }
      }
    }

    return result
  }

  // Print text
  async printText(text, options = {}) {
    const {
      bold = false,
      doubleHeight = false,
      doubleWidth = false,
      align = 'left', // left, center, right
    } = options

    // Set text mode
    let mode = 0
    if (bold) mode |= 0x08
    if (doubleHeight) mode |= 0x10
    if (doubleWidth) mode |= 0x20

    // ESC ! n - Set print mode
    const modeCmd = new Uint8Array([0x1B, 0x21, mode])
    await this.sendCommand(modeCmd)

    // Set alignment
    // ESC a n - Set alignment (0=left, 1=center, 2=right)
    const alignMap = { left: 0, center: 1, right: 2 }
    const alignCmd = new Uint8Array([0x1B, 0x61, alignMap[align] || 0])
    await this.sendCommand(alignCmd)

    // Encode and send text
    const encoder = new TextEncoder()
    const textData = encoder.encode(text)
    await this.sendCommand(textData)

    // Reset to normal
    await this.sendCommand(new Uint8Array([0x1B, 0x21, 0x00]))
  }

  // Feed paper
  async feedPaper(lines = 3) {
    const feedCmd = new Uint8Array([0x1B, 0x4A, lines * 8])
    await this.sendCommand(feedCmd)
  }

  // Cut paper (if supported)
  async cutPaper() {
    await this.sendCommand(COMMANDS.CUT)
  }

  // Utility: sleep
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Get printer info
  getInfo() {
    return {
      name: this.device?.name || 'Unknown',
      connected: this.isConnected,
    }
  }
}

// Singleton instance
let printerInstance = null

export const getPrinter = () => {
  if (!printerInstance) {
    printerInstance = new ThermalPrinter()
  }
  return printerInstance
}

export default ThermalPrinter
