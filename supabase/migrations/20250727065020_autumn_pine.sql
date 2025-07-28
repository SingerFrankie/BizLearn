/*
  # Create Chat History Table

  1. New Tables
    - `chat_history`
      - `id` (uuid, primary key) - Unique identifier for each chat interaction
      - `user_id` (uuid, foreign key) - References auth.users for user ownership
      - `question` (text) - User's question/input to the AI assistant
      - `answer` (text) - AI assistant's response
      - `is_bookmarked` (boolean, default false) - Whether user bookmarked this interaction
      - `conversation_id` (uuid) - Groups related messages in a conversation thread
      - `message_type` (text) - Type of message (question, answer, system)
      - `tokens_used` (integer) - Number of tokens consumed for this interaction
      - `model_used` (text) - AI model used for generating the response
      - `response_time_ms` (integer) - Time taken to generate response in milliseconds
      - `created_at` (timestamptz, default now()) - When the interaction occurred
      - `updated_at` (timestamptz, default now()) - When the record was last modified

  2. Security
    - Enable RLS on `chat_history` table
    - Add policy for users to read their own chat history
    - Add policy for users to insert their own chat history
    - Add policy for users to update their own chat history (for bookmarking)
    - Add policy for users to delete their own chat history

  3. Indexes
    - Index on user_id for fast user-specific queries
    - Index on conversation_id for grouping related messages
    - Index on created_at for chronological ordering
    - Index on is_bookmarked for filtering bookmarked messages

  4. Functions
    - Trigger to automatically update updated_at timestamp
*/

-- Create the chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  is_bookmarked boolean DEFAULT false,
  conversation_id uuid DEFAULT gen_random_uuid(),
  message_type text DEFAULT 'interaction' CHECK (message_type IN ('interaction', 'system', 'error')),
  tokens_used integer DEFAULT 0,
  model_used text DEFAULT 'tngtech/deepseek-r1t2-chimera:free',
  response_time_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_conversation_id ON chat_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_bookmarked ON chat_history(user_id, is_bookmarked) WHERE is_bookmarked = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_chat_history_updated_at ON chat_history;
CREATE TRIGGER update_chat_history_updated_at
  BEFORE UPDATE ON chat_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Policy: Users can read their own chat history
CREATE POLICY "Users can read own chat history"
  ON chat_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat history
CREATE POLICY "Users can insert own chat history"
  ON chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chat history (for bookmarking, etc.)
CREATE POLICY "Users can update own chat history"
  ON chat_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own chat history
CREATE POLICY "Users can delete own chat history"
  ON chat_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON chat_history TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;