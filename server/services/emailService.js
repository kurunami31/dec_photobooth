import nodemailer from 'nodemailer'

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

const generateHtmlTemplate = (shareUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Photo Strip from DEC Photobooth</title>
    </head>
    <body style="margin:0;padding:0;background-color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#111111;">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;">

              <!-- Logo -->
              <tr>
                <td align="center" style="padding-bottom:32px;">
                  <img src="cid:logo" alt="DEC" width="48" height="48" style="display:block;border-radius:12px;" />
                </td>
              </tr>

              <!-- Title -->
              <tr>
                <td align="center" style="padding-bottom:8px;">
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                    Your Photobooth Moment
                  </h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:32px;">
                  <p style="margin:0;font-size:14px;color:#888888;">
                    From DEC Photobooth
                  </p>
                </td>
              </tr>

              <!-- Photo Strip -->
              <tr>
                <td align="center" style="padding-bottom:32px;">
                  <img src="cid:photostrip" alt="Photo strip" style="display:block;max-width:100%;height:auto;border-radius:12px;border:1px solid rgba(255,255,255,0.08);" />
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td align="center" style="padding-bottom:40px;">
                  <a href="${shareUrl}" style="display:inline-block;background:linear-gradient(135deg,#E53935,#C62828);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:14px;">
                    View &amp; Download
                  </a>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding-bottom:32px;">
                  <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);"></div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center">
                  <p style="margin:0 0 8px;font-size:12px;color:#666666;">
                    Captured with DEC Photobooth
                  </p>
                  <a href="${shareUrl}" style="font-size:12px;color:#E53935;text-decoration:none;">
                    ${shareUrl}
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:16px;">
                  <p style="margin:0;font-size:11px;color:#444444;">
                    This link expires in 7 days
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

const generatePlainText = (shareUrl) => {
  return [
    'Your Photobooth Moment',
    'From DEC Photobooth',
    '',
    'View and download your photo strip:',
    shareUrl,
    '',
    'This link expires in 7 days.',
    '',
    'Captured with DEC Photobooth',
  ].join('\n')
}

const fetchLogoAsBuffer = async () => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  try {
    const response = await fetch(`${clientUrl}/logo.png`)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

export const sendPhotoEmail = async ({ to, imageUrl, shareToken }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Skipping email send.')
    return { success: false, error: 'Email not configured' }
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const shareUrl = shareToken
    ? `${clientUrl}/share/${shareToken}`
    : clientUrl

  const transporter = createTransporter()

  // Build attachments
  const attachments = []

  // Photo strip as CID inline
  if (imageUrl) {
    let imageBuffer
    if (imageUrl.startsWith('data:')) {
      const base64 = imageUrl.split(',')[1]
      imageBuffer = Buffer.from(base64, 'base64')
    } else {
      try {
        const response = await fetch(imageUrl)
        const arrayBuffer = await response.arrayBuffer()
        imageBuffer = Buffer.from(arrayBuffer)
      } catch {
        return { success: false, error: 'Failed to process image' }
      }
    }

    attachments.push({
      filename: 'photostrip.jpg',
      content: imageBuffer,
      cid: 'photostrip',
      contentDisposition: 'inline',
    })
  }

  // Logo as CID inline
  const logoBuffer = await fetchLogoAsBuffer()
  if (logoBuffer) {
    attachments.push({
      filename: 'logo.png',
      content: logoBuffer,
      cid: 'logo',
      contentDisposition: 'inline',
    })
  }

  const mailOptions = {
    from: {
      name: 'DEC Photobooth',
      address: process.env.EMAIL_USER,
    },
    to,
    subject: 'Your photobooth moment is here',
    text: generatePlainText(shareUrl),
    html: generateHtmlTemplate(shareUrl),
    attachments,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

export default { sendPhotoEmail }
