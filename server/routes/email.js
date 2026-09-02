import { Router } from 'express'
import { sendPhotoEmail } from '../services/emailService.js'
import db from '../services/supabase.js'

const router = Router()

// POST /api/email/send - Send photo via email
router.post('/send', async (req, res) => {
  try {
    const { to, photoId, imageUrl } = req.body

    if (!to || !imageUrl) {
      return res.status(400).json({ error: 'Email and image are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Look up share token from the photo record
    let shareToken = null
    if (photoId) {
      const photo = await db.getPhoto(photoId)
      if (photo && photo.share_token) {
        shareToken = photo.share_token
      }
    }

    // Send email
    const result = await sendPhotoEmail({
      to,
      imageUrl,
      shareToken,
    })

    if (result.success) {
      // Record email in database if photoId exists
      if (photoId) {
        await db.updatePhoto(photoId, { emailed_to: to })
      }

      res.json({ success: true, message: 'Email sent successfully' })
    } else {
      res.status(500).json({ error: result.error || 'Failed to send email' })
    }
  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// POST /api/email/validate - Validate email address
router.post('/validate', (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ valid: false, error: 'Email is required' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email)

  res.json({ valid: isValid })
})

export default router
