/*
  # Create bookmarks table for chat responses and lessons

  1. New Tables
    - `bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (enum: lesson | chat)
      - `related_id` (uuid, points to chat_history or lesson)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `bookmarks` table
    - Add policies for authenticated users to manage their own bookmarks

  3. Performance
    - Add indexes for efficient querying by user, type, and related_id
    - Unique constraint to prevent duplicate bookmarks
*/

-- Create bookmark type enum
CREATE TYPE bookmark_type AS ENUM ('lesson', 'chat');

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type bookmark_type NOT NULL,
  related_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_type ON bookmarks(user_id, type);
CREATE INDEX idx_bookmarks_related_id ON bookmarks(related_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Unique constraint to prevent duplicate bookmarks
CREATE UNIQUE INDEX unique_user_bookmark ON bookmarks(user_id, type, related_id);

-- Sample bookmarks data (optional - for testing)
DO $$
DECLARE
  sample_user_id uuid;
  sample_lesson_id uuid;
  sample_chat_id uuid;
BEGIN
  -- Get a sample user (first user in auth.users)
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  -- Get sample lesson and chat IDs
  SELECT id INTO sample_lesson_id FROM lessons LIMIT 1;
  SELECT id INTO sample_chat_id FROM chat_history LIMIT 1;
  
  -- Only insert if we have valid IDs
  IF sample_user_id IS NOT NULL AND sample_lesson_id IS NOT NULL THEN
    INSERT INTO bookmarks (user_id, type, related_id) VALUES
    (sample_user_id, 'lesson', sample_lesson_id);
  END IF;
  
  IF sample_user_id IS NOT NULL AND sample_chat_id IS NOT NULL THEN
    INSERT INTO bookmarks (user_id, type, related_id) VALUES
    (sample_user_id, 'chat', sample_chat_id);
  END IF;
END $$;