/*
  # Create voice_conversations table for RishikaVox

  1. New Tables
    - `voice_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, not null)
      - `summary` (text, not null)
      - `messages` (jsonb, not null)
      - `timestamp` (bigint, not null)
      - `duration` (integer, not null)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for users to access their own conversations
    - Add indexes for better performance
*/

-- Create voice_conversations table
CREATE TABLE IF NOT EXISTS voice_conversations (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL,
  messages jsonb NOT NULL,
  timestamp bigint NOT NULL,
  duration integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for voice_conversations
CREATE POLICY "Users can view their own voice conversations"
  ON voice_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice conversations"
  ON voice_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice conversations"
  ON voice_conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_conversations_user_id ON voice_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_timestamp ON voice_conversations(timestamp);