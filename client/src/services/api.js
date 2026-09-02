import axios from 'axios'

const API_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
  : ''

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Photo API
export const photoAPI = {
  async save(data) {
    const response = await api.post('/photos', data)
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/photos/${id}`)
    return response.data
  },

  async getByShareToken(token) {
    const response = await api.get(`/photos/share/${token}`)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/photos/${id}`)
    return response.data
  },

  async getRecent(limit = 20) {
    const response = await api.get('/photos', { params: { limit } })
    return response.data
  },
}

// Email API
export const emailAPI = {
  async send(data) {
    const response = await api.post('/email/send', data)
    return response.data
  },

  async validate(email) {
    const response = await api.post('/email/validate', { email })
    return response.data
  },
}

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    return { status: 'error', message: error.message }
  }
}

export default api
