/*
  # Add subscription history table and update user_subscription table

  1. New Tables
    - `subscription_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tier` (text, not null)
      - `start_date` (timestamp, not null)
      - `end_date` (timestamp)
      - `status` (text, not null)
      - `created_at` (timestamp)

  2. Updates to existing tables
    - Add `valid_until` to `user_subscription` table
    - Add `payment_provider` to `user_subscription` table
    - Add `provider_subscription_id` to `user_subscription` table

  3. Security
    - Enable RLS on new table
    - Add policies for users to view their own subscription history
*/

-- Add new columns to user_subscription table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscription' AND column_name = 'valid_until'
  ) THEN
    ALTER TABLE user_subscription ADD COLUMN valid_until timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscription' AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE user_subscription ADD COLUMN payment_provider text DEFAULT 'revenuecat';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscription' AND column_name = 'provider_subscription_id'
  ) THEN
    ALTER TABLE user_subscription ADD COLUMN provider_subscription_id text;
  END IF;
END $$;

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('free', 'pro', 'super_pro')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_provider text DEFAULT 'revenuecat',
  provider_subscription_id text,
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
CREATE INDEX IF NOT EXISTS idx_user_subscription_valid_until ON user_subscription(valid_until);

-- Create function to automatically add to subscription history when subscription changes
CREATE OR REPLACE FUNCTION public.handle_subscription_change()
RETURNS trigger AS $$
BEGIN
  -- If this is a new active subscription or an update that changes the tier
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR 
     (TG_OP = 'UPDATE' AND OLD.tier != NEW.tier AND NEW.active = true) THEN
    
    -- First, mark any previous active subscription as expired
    IF TG_OP = 'UPDATE' AND OLD.active = true AND OLD.tier != NEW.tier THEN
      INSERT INTO subscription_history (
        user_id, 
        tier, 
        start_date, 
        end_date, 
        status,
        payment_provider,
        provider_subscription_id
      )
      VALUES (
        OLD.user_id,
        OLD.tier,
        OLD.start_date,
        now(),
        'expired',
        OLD.payment_provider,
        OLD.provider_subscription_id
      );
    END IF;
    
    -- Then, add the new subscription to history
    INSERT INTO subscription_history (
      user_id, 
      tier, 
      start_date, 
      end_date, 
      status,
      payment_provider,
      provider_subscription_id
    )
    VALUES (
      NEW.user_id,
      NEW.tier,
      NEW.start_date,
      NEW.end_date,
      'active',
      NEW.payment_provider,
      NEW.provider_subscription_id
    );
  
  -- If this is an update that deactivates a subscription
  ELSIF TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = false THEN
    INSERT INTO subscription_history (
      user_id, 
      tier, 
      start_date, 
      end_date, 
      status,
      payment_provider,
      provider_subscription_id
    )
    VALUES (
      OLD.user_id,
      OLD.tier,
      OLD.start_date,
      now(),
      'cancelled',
      OLD.payment_provider,
      OLD.provider_subscription_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscription changes
DROP TRIGGER IF EXISTS on_subscription_change ON user_subscription;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON user_subscription
  FOR EACH ROW EXECUTE PROCEDURE public.handle_subscription_change();