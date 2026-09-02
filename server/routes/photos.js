import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../services/supabase.js'

const router = Router()

// Generate share token
const generateShareToken = () => {
  return uuidv4().replace(/-/g, '').substring(0, 12)
}

// POST /api/photos - Save a new photo
router.post('/', async (req, res) => {
  try {
    const { image, layout, filters, frame, text, session_id } = req.body

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' })
    }

    const shareToken = generateShareToken()
    
    const photoData = {
      session_id: session_id || uuidv4(),
      image_url: image,
      layout_type: layout || 'classic',
      filters_applied: filters || {},
      frame_used: frame || 'none',
      custom_text: text || null,
      share_token: shareToken,
      share_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    const photo = await db.insertPhoto(photoData)

    res.json({
      success: true,
      data: {
        id: photo.id,
        share_token: shareToken,
        share_url: `${process.env.CLIENT_URL}/share/${shareToken}`,
      },
    })
  } catch (error) {
    console.error('Save photo error:', error)
    res.status(500).json({ error: 'Failed to save photo' })
  }
})

// GET /api/photos/:id - Get a photo by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const photo = await db.getPhoto(id)

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' })
    }

    res.json({ success: true, data: photo })
  } catch (error) {
    console.error('Get photo error:', error)
    res.status(500).json({ error: 'Failed to get photo' })
  }
})

// GET /api/photos/share/:token - Get photo by share token
router.get('/share/:token', async (req, res) => {
  try {
    const { token } = req.params
    const photo = await db.getPhotoByShareToken(token)

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found or link expired' })
    }

    // Check if expired
    if (new Date(photo.share_expires_at) < new Date()) {
      return res.status(410).json({ error: 'Share link has expired' })
    }

    res.json({ success: true, data: photo })
  } catch (error) {
    console.error('Get shared photo error:', error)
    res.status(500).json({ error: 'Failed to get photo' })
  }
})

// PUT /api/photos/:id/email - Record email sent
router.put('/:id/email', async (req, res) => {
  try {
    const { id } = req.params
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const photo = await db.updatePhoto(id, { emailed_to: email })

    res.json({ success: true, data: photo })
  } catch (error) {
    console.error('Update email error:', error)
    res.status(500).json({ error: 'Failed to update photo' })
  }
})

// DELETE /api/photos/:id - Delete a photo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.deletePhoto(id)

    res.json({ success: true })
  } catch (error) {
    console.error('Delete photo error:', error)
    res.status(500).json({ error: 'Failed to delete photo' })
  }
})

// GET /api/photos - Get recent photos
router.get('/', async (req, res) => {
  try {
    const { limit = 20 } = req.query
    const photos = await db.getRecentPhotos(parseInt(limit))

    res.json({ success: true, data: photos })
  } catch (error) {
    console.error('List photos error:', error)
    res.status(500).json({ error: 'Failed to list photos' })
  }
})

export default router
