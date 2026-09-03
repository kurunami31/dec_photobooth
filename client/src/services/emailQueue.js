import { emailAPI } from './api'
import { queueEmail, getPendingEmails, markEmailSent, removeEmail } from './db'

export async function sendOrQueueEmail(emailData) {
  if (navigator.onLine) {
    try {
      const result = await emailAPI.send(emailData)
      if (result.success) return { queued: false, success: true }
    } catch {
      // offline or server error — queue it
    }
  }

  await queueEmail(emailData)
  return { queued: true, success: true }
}

export async function processEmailQueue() {
  if (!navigator.onLine) return { sent: 0, failed: 0 }

  const pending = await getPendingEmails()
  let sent = 0
  let failed = 0

  for (const email of pending) {
    try {
      const result = await emailAPI.send({
        to: email.to,
        imageUrl: email.imageUrl,
        photoId: email.photoId,
      })

      if (result.success) {
        await removeEmail(email.id)
        sent++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { sent, failed }
}
