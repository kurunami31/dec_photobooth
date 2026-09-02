-- DEC Photobooth Database Schema
-- For Supabase / PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Session info
  session_id TEXT NOT NULL,
  
  -- Photo data
  image_url TEXT NOT NULL,
  layout_type TEXT DEFAULT 'classic',
  filters_applied JSONB DEFAULT '{}',
  frame_used TEXT DEFAULT 'none',
  custom_text TEXT,
  
  -- Share settings
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMPTZ,
  
  -- Email tracking
  emailed_to TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_session ON photos(session_id);
CREATE INDEX IF NOT EXISTS idx_photos_share_token ON photos(share_token);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policies (for Supabase)

-- Allow public read access to photos with valid share tokens
CREATE POLICY "Public can view shared photos"
  ON photos FOR SELECT
  USING (
    share_token IS NOT NULL 
    AND share_expires_at > NOW()
  );

-- Allow authenticated users to insert photos
CREATE POLICY "Anyone can insert photos"
  ON photos FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own photos (by session_id)
CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  USING (true);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  USING (true);

-- Comments
COMMENT ON TABLE photos IS 'DEC Photobooth captured photo strips';
COMMENT ON COLUMN photos.image_url IS 'Base64 encoded image or URL';
COMMENT ON COLUMN photos.layout_type IS 'classic, grid, horizontal, polaroid';
COMMENT ON COLUMN photos.filters_applied IS 'JSON object of applied filters';
COMMENT ON COLUMN photos.frame_used IS 'Frame style identifier';
COMMENT ON COLUMN photos.share_token IS 'Unique token for sharing';
COMMENT ON COLUMN photos.share_expires_at IS 'When the share link expires';
