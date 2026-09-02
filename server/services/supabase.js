import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Using local storage fallback.')
}

// Create Supabase client (will be null if not configured)
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Database operations
export const db = {
  // Insert a new photo record
  async insertPhoto(photoData) {
    if (!supabase) {
      // Fallback: return mock data for local development
      return { id: Date.now().toString(), ...photoData }
    }

    const { data, error } = await supabase
      .from('photos')
      .insert(photoData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get photo by ID
  async getPhoto(id) {
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Get photo by share token
  async getPhotoByShareToken(token) {
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('share_token', token)
      .single()

    if (error) throw error
    return data
  },

  // Update photo (e.g., add email, share token)
  async updatePhoto(id, updates) {
    if (!supabase) {
      return { id, ...updates }
    }

    const { data, error } = await supabase
      .from('photos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete photo
  async deletePhoto(id) {
    if (!supabase) {
      return true
    }

    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  // Get recent photos
  async getRecentPhotos(limit = 20) {
    if (!supabase) {
      return []
    }

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
}

export default db
