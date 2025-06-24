/*
  # Create AI usage tracking table

  1. New Tables
    - `ai_usage_tracking`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date, not null)
      - `text_prompts_used` (integer, default 0)
      - `voice_calls_used` (integer, default 0)
      - `video_calls_used` (integer, default 0)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for users to access their own usage data
    - Add indexes for better performance
*/

-- Create ai_usage_tracking table
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  text_prompts_used integer NOT NULL DEFAULT 0,
  voice_calls_used integer NOT NULL DEFAULT 0,
  video_calls_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for ai_usage_tracking
CREATE POLICY "Users can view their own usage data"
  ON ai_usage_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage data"
  ON ai_usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage data"
  ON ai_usage_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_user_id ON ai_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_date ON ai_usage_tracking(date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_user_date ON ai_usage_tracking(user_id, date);

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id uuid,
  p_type text,
  p_increment integer DEFAULT 1
)
RETURNS void AS $$
DECLARE
  v_today date := current_date;
BEGIN
  -- Insert or update the usage record for today
  INSERT INTO ai_usage_tracking (user_id, date, text_prompts_used, voice_calls_used, video_calls_used)
  VALUES (
    p_user_id, 
    v_today, 
    CASE WHEN p_type = 'text' THEN p_increment ELSE 0 END,
    CASE WHEN p_type = 'voice' THEN p_increment ELSE 0 END,
    CASE WHEN p_type = 'video' THEN p_increment ELSE 0 END
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    text_prompts_used = CASE 
      WHEN p_type = 'text' 
      THEN ai_usage_tracking.text_prompts_used + p_increment
      ELSE ai_usage_tracking.text_prompts_used
    END,
    voice_calls_used = CASE 
      WHEN p_type = 'voice' 
      THEN ai_usage_tracking.voice_calls_used + p_increment
      ELSE ai_usage_tracking.voice_calls_used
    END,
    video_calls_used = CASE 
      WHEN p_type = 'video' 
      THEN ai_usage_tracking.video_calls_used + p_increment
      ELSE ai_usage_tracking.video_calls_used
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage:
-- SELECT increment_ai_usage('user-uuid', 'text', 1);
-- SELECT increment_ai_usage('user-uuid', 'voice', 1);
-- SELECT increment_ai_usage('user-uuid', 'video', 1);