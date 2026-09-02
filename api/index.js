import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const db = {
  async insertPhoto(photoData) {
    if (!supabase) return { id: Date.now().toString(), ...photoData }
    const { data, error } = await supabase.from('photos').insert(photoData).select().single()
    if (error) throw error
    return data
  },
  async getPhoto(id) {
    if (!supabase) return null
    const { data, error } = await supabase.from('photos').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },
  async getPhotoByShareToken(token) {
    if (!supabase) return null
    const { data, error } = await supabase.from('photos').select('*').eq('share_token', token).single()
    if (error) throw error
    return data
  },
  async updatePhoto(id, updates) {
    if (!supabase) return { id, ...updates }
    const { data, error } = await supabase.from('photos').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deletePhoto(id) {
    if (!supabase) return true
    const { error } = await supabase.from('photos').delete().eq('id', id)
    if (error) throw error
    return true
  },
  async getRecentPhotos(limit = 20) {
    if (!supabase) return []
    const { data, error } = await supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    return data
  },
}

const generateShareToken = () => uuidv4().replace(/-/g, '').substring(0, 12)

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

app.get('/api/photos', async (req, res) => {
  try {
    const { limit = 20 } = req.query
    const photos = await db.getRecentPhotos(parseInt(limit))
    res.json({ success: true, data: photos })
  } catch (error) {
    console.error('List photos error:', error)
    res.status(500).json({ error: 'Failed to list photos' })
  }
})

app.post('/api/photos', async (req, res) => {
  try {
    const { image, layout, filters, frame, text, session_id } = req.body
    if (!image) return res.status(400).json({ error: 'Image data is required' })

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
      data: { id: photo.id, share_token: shareToken, share_url: `${process.env.CLIENT_URL || ''}/share/${shareToken}` },
    })
  } catch (error) {
    console.error('Save photo error:', error)
    res.status(500).json({ error: 'Failed to save photo' })
  }
})

app.get('/api/photos/share/:token', async (req, res) => {
  try {
    const photo = await db.getPhotoByShareToken(req.params.token)
    if (!photo) return res.status(404).json({ error: 'Photo not found or link expired' })
    if (new Date(photo.share_expires_at) < new Date()) return res.status(410).json({ error: 'Share link has expired' })
    res.json({ success: true, data: photo })
  } catch (error) {
    console.error('Get shared photo error:', error)
    res.status(500).json({ error: 'Failed to get photo' })
  }
})

app.get('/api/photos/:id', async (req, res) => {
  try {
    const photo = await db.getPhoto(req.params.id)
    if (!photo) return res.status(404).json({ error: 'Photo not found' })
    res.json({ success: true, data: photo })
  } catch (error) {
    console.error('Get photo error:', error)
    res.status(500).json({ error: 'Failed to get photo' })
  }
})

app.put('/api/photos/:id/email', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })
    const photo = await db.updatePhoto(req.params.id, { emailed_to: email })
    res.json({ success: true, data: photo })
  } catch (error) {
    console.error('Update email error:', error)
    res.status(500).json({ error: 'Failed to update photo' })
  }
})

app.delete('/api/photos/:id', async (req, res) => {
  try {
    await db.deletePhoto(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete photo error:', error)
    res.status(500).json({ error: 'Failed to delete photo' })
  }
})

app.post('/api/email/validate', (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ valid: false, error: 'Email is required' })
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  res.json({ valid: isValid })
})

app.post('/api/email/send', async (req, res) => {
  try {
    const { to, photoId, imageUrl } = req.body
    if (!to || !imageUrl) return res.status(400).json({ error: 'Email and image are required' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ error: 'Invalid email format' })

    let shareToken = null
    if (photoId) {
      const photo = await db.getPhoto(photoId)
      if (photo && photo.share_token) shareToken = photo.share_token
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: 'Email not configured' })
    }

    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const shareUrl = shareToken ? `${clientUrl}/share/${shareToken}` : clientUrl

    const attachments = []
    if (imageUrl && imageUrl.startsWith('data:')) {
      const base64 = imageUrl.split(',')[1]
      if (base64) {
        attachments.push({ filename: 'photostrip.jpg', content: Buffer.from(base64, 'base64'), cid: 'photostrip', contentDisposition: 'inline' })
      }
    }

    await transporter.sendMail({
      from: { name: 'DEC Photobooth', address: process.env.EMAIL_USER },
      to,
      subject: 'Your photobooth moment is here',
      text: `Here's your photo strip from DEC Photobooth.\n\nCaptured with DEC Photobooth`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%"><tr><td align="center" style="padding-bottom:24px"><h1 style="margin:0;font-size:22px;font-weight:700;color:#fff">Your Photobooth Moment</h1></td></tr><tr><td align="center" style="padding-bottom:8px"><p style="margin:0;font-size:14px;color:#888">From DEC Photobooth</p></td></tr><tr><td align="center" style="padding-bottom:24px"><img src="cid:photostrip" alt="Photo strip" style="display:block;max-width:100%;height:auto;border-radius:12px;border:1px solid rgba(255,255,255,0.08)" /></td></tr><tr><td align="center"><p style="margin:0;font-size:12px;color:#666">Captured with DEC Photobooth</p></td></tr></table></td></tr></table></body></html>`,
      attachments,
    })

    if (photoId) await db.updatePhoto(photoId, { emailed_to: to })
    res.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
