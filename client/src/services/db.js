const DB_NAME = 'dec-photobooth'
const DB_VERSION = 1
const PHOTOS_STORE = 'photos'
const EMAIL_QUEUE_STORE = 'emailQueue'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        const store = db.createObjectStore(PHOTOS_STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('synced', 'synced', { unique: false })
      }

      if (!db.objectStoreNames.contains(EMAIL_QUEUE_STORE)) {
        const store = db.createObjectStore(EMAIL_QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('status', 'status', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function tx(storeName, mode = 'readonly') {
  return openDB().then(db => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    return { transaction, store }
  })
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Photos CRUD

export async function savePhoto(photo) {
  const { store } = await tx(PHOTOS_STORE, 'readwrite')
  const record = {
    ...photo,
    synced: false,
    timestamp: photo.timestamp || new Date().toISOString(),
  }
  return promisify(store.put(record))
}

export async function getRecentPhotos(limit = 50) {
  const { store } = await tx(PHOTOS_STORE)
  const index = store.index('timestamp')
  const results = []

  return new Promise((resolve, reject) => {
    const request = index.openCursor(null, 'prev')
    let count = 0

    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor && count < limit) {
        results.push(cursor.value)
        count++
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deletePhoto(id) {
  const { store } = await tx(PHOTOS_STORE, 'readwrite')
  return promisify(store.delete(id))
}

export async function getPhoto(id) {
  const { store } = await tx(PHOTOS_STORE)
  return promisify(store.get(id))
}

export async function getPendingSync() {
  const { store } = await tx(PHOTOS_STORE)
  const index = store.index('synced')

  return new Promise((resolve, reject) => {
    const request = index.getAll(false)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function markSynced(id) {
  const photo = await getPhoto(id)
  if (!photo) return
  photo.synced = true
  const { store } = await tx(PHOTOS_STORE, 'readwrite')
  return promisify(store.put(photo))
}

export async function clearPhotos() {
  const { store } = await tx(PHOTOS_STORE, 'readwrite')
  return promisify(store.clear())
}

// Email Queue

export async function queueEmail(emailData) {
  const { store } = await tx(EMAIL_QUEUE_STORE, 'readwrite')
  const record = {
    ...emailData,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  return promisify(store.put(record))
}

export async function getPendingEmails() {
  const { store } = await tx(EMAIL_QUEUE_STORE)
  const index = store.index('status')

  return new Promise((resolve, reject) => {
    const request = index.getAll('pending')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function markEmailSent(id) {
  const { store } = await tx(EMAIL_QUEUE_STORE, 'readwrite')
  const record = await promisify(store.get(id))
  if (record) {
    record.status = 'sent'
    return promisify(store.put(record))
  }
}

export async function markEmailFailed(id) {
  const { store } = await tx(EMAIL_QUEUE_STORE, 'readwrite')
  const record = await promisify(store.get(id))
  if (record) {
    record.status = 'failed'
    record.lastAttempt = new Date().toISOString()
    return promisify(store.put(record))
  }
}

export async function removeEmail(id) {
  const { store } = await tx(EMAIL_QUEUE_STORE, 'readwrite')
  return promisify(store.delete(id))
}
