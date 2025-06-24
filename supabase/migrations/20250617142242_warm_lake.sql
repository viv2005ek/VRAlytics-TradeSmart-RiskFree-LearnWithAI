/*
  # Create subscription history table

  1. New Tables
    - `subscription_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tier` (text, not null)
      - `start_date` (timestamp, not null)
      - `end_date` (timestamp)
      - `status` (text, not null)
      - `payment_provider` (text, default 'revenuecat')
      - `provider_subscription_id` (text)
      - `is_trial` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on new table
    - Add policies for users to view their own subscription history
*/

-- Create subscription_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('free', 'pro', 'super_pro')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_provider text DEFAULT 'revenuecat',
  provider_subscription_id text,
  is_trial boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_history
CREATE POLICY "Users can view their own subscription history"
  ON subscription_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_tier ON subscription_history(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON subscription_history(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_is_trial ON subscription_history(is_trial);