import nodemailer from 'nodemailer'

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Generate HTML email template
const generateEmailTemplate = (imageUrl, shareUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #1a1a1a;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #1a1a1a;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          width: 60px;
          height: 60px;
          margin: 0 auto 15px;
        }
        .title {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        .subtitle {
          color: #888888;
          font-size: 14px;
          margin-top: 8px;
        }
        .content {
          background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .image-container {
          text-align: center;
        }
        .image-container img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
        }
        .cta-container {
          text-align: center;
          margin: 30px 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
          margin: 30px 0;
        }
        .footer {
          text-align: center;
          color: #666666;
          font-size: 12px;
        }
        .footer a {
          color: #E53935;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:logo" alt="DEC" class="logo">
          <h1 class="title">Your Photo Strip</h1>
          <p class="subtitle">From DEC Photobooth</p>
        </div>

        <div class="content">
          <div class="image-container">
            <img src="${imageUrl}" alt="Photo Strip">
          </div>
        </div>

        <div class="cta-container">
          <a href="${shareUrl}" class="cta-button">View & Download</a>
        </div>

        <div class="divider"></div>

        <div class="footer">
          <p>Captured with DEC Photobooth</p>
          <p><a href="${shareUrl}">${shareUrl}</a></p>
          <p style="margin-top: 20px; color: #444444;">
            This link expires in 7 days
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Send email with photo
export const sendPhotoEmail = async ({ to, imageUrl, shareUrl }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Skipping email send.')
    return { success: false, error: 'Email not configured' }
  }

  const transporter = createTransporter()

  const mailOptions = {
    from: {
      name: 'DEC Photobooth',
      address: process.env.EMAIL_USER,
    },
    to,
    subject: 'Your Photo Strip from DEC Photobooth',
    html: generateEmailTemplate(imageUrl, shareUrl),
    attachments: [{
      filename: 'logo.png',
      path: '../client/public/logo.png',
      cid: 'logo',
    }],
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
