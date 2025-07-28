/*
  # Create Notes Table for Learning and Assistant

  1. New Tables
    - `notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `content` (text, note content)
      - `type` (enum, assistant or lesson)
      - `related_id` (uuid, lesson_id or chat_id)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notes` table
    - Add policies for authenticated users to manage their own notes

  3. Indexes
    - Index on user_id for fast user queries
    - Index on type for filtering
    - Index on related_id for related content queries
    - Composite index on user_id + type for efficient filtering
*/

-- Create enum for note types
CREATE TYPE note_type AS ENUM ('assistant', 'lesson');

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  type note_type NOT NULL,
  related_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_related_id ON notes(related_id);
CREATE INDEX idx_notes_user_type ON notes(user_id, type);
CREATE INDEX idx_notes_user_related ON notes(user_id, related_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

-- Insert sample notes data
INSERT INTO notes (user_id, content, type, related_id) VALUES
  -- Sample assistant notes (using random UUIDs for chat_id)
  ('00000000-0000-0000-0000-000000000000', 'Great advice on marketing strategy - focus on digital channels first', 'assistant', gen_random_uuid()),
  ('00000000-0000-0000-0000-000000000000', 'Remember to calculate ROI for each marketing campaign', 'assistant', gen_random_uuid()),
  ('00000000-0000-0000-0000-000000000000', 'Key insight: Customer acquisition cost should be 3x less than lifetime value', 'assistant', gen_random_uuid()),
  
  -- Sample lesson notes (using lesson IDs from lessons table)
  ('00000000-0000-0000-0000-000000000000', 'Important: Market research should include competitor analysis', 'lesson', (SELECT id FROM lessons WHERE title LIKE '%Market Research%' LIMIT 1)),
  ('00000000-0000-0000-0000-000000000000', 'Key takeaway: Define target audience before creating marketing materials', 'lesson', (SELECT id FROM lessons WHERE title LIKE '%Target Audience%' LIMIT 1)),
  ('00000000-0000-0000-0000-000000000000', 'Note: Financial projections should be conservative but realistic', 'lesson', (SELECT id FROM lessons WHERE title LIKE '%Financial Planning%' LIMIT 1));