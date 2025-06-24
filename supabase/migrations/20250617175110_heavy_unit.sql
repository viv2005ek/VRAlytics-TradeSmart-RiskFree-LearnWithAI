/*
  # Create AI-related tables for VRAlytics

  1. New Tables
    - `neuro_chat_history` - Stores chat interactions with AI
    - `user_usage_voice` - Tracks voice call usage
    - `video_call_logs` - Tracks video call usage
    - `user_subscription` - Manages user subscription tiers

  2. Security
    - Enable RLS on all tables
    - Add policies for users to access their own data
    - Add indexes for better performance
*/

-- Create neuro_chat_history table
CREATE TABLE IF NOT EXISTS neuro_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  response text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ai_persona text NOT NULL CHECK (ai_persona IN ('neuronushka', 'rishikavox', 'vivekquant'))
);

-- Create user_usage_voice table
CREATE TABLE IF NOT EXISTS user_usage_voice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  call_date date NOT NULL,
  ai_persona text NOT NULL CHECK (ai_persona IN ('rishikavox')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create video_call_logs table
CREATE TABLE IF NOT EXISTS video_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  call_date date NOT NULL,
  ai_persona text NOT NULL CHECK (ai_persona IN ('vivekquant')),
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_subscription table
CREATE TABLE IF NOT EXISTS user_subscription (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('free', 'pro', 'super_pro')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  active boolean NOT NULL DEFAULT true,
  payment_provider text DEFAULT 'revenuecat',
  provider_subscription_id text,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

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
  is_trial boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE neuro_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_voice ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Policies for neuro_chat_history
CREATE POLICY "Users can view their own chat history"
  ON neuro_chat_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history"
  ON neuro_chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_usage_voice
CREATE POLICY "Users can view their own voice usage"
  ON user_usage_voice
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice usage"
  ON user_usage_voice
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for video_call_logs
CREATE POLICY "Users can view their own video call logs"
  ON video_call_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video call logs"
  ON video_call_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_subscription
CREATE POLICY "Users can view their own subscription"
  ON user_subscription
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for subscription_history
CREATE POLICY "Users can view their own subscription history"
  ON subscription_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_neuro_chat_history_user_id ON neuro_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_neuro_chat_history_timestamp ON neuro_chat_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_neuro_chat_history_ai_persona ON neuro_chat_history(ai_persona);

CREATE INDEX IF NOT EXISTS idx_user_usage_voice_user_id ON user_usage_voice(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_voice_call_date ON user_usage_voice(call_date);

CREATE INDEX IF NOT EXISTS idx_video_call_logs_user_id ON video_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_call_logs_call_date ON video_call_logs(call_date);

CREATE INDEX IF NOT EXISTS idx_user_subscription_user_id ON user_subscription(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscription_tier ON user_subscription(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscription_active ON user_subscription(active);
CREATE INDEX IF NOT EXISTS idx_user_subscription_valid_until ON user_subscription(valid_until);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_tier ON subscription_history(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON subscription_history(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_is_trial ON subscription_history(is_trial);

-- Create function to update updated_at timestamp if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Create trigger to update updated_at on user_subscription changes
DROP TRIGGER IF EXISTS user_subscription_updated_at ON user_subscription;
CREATE TRIGGER user_subscription_updated_at
  BEFORE UPDATE ON user_subscription
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert default free tier subscription for all existing users
INSERT INTO user_subscription (user_id, tier)
SELECT id, 'free' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Create function to automatically create subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_subscription (user_id, tier)
  VALUES (new.id, 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create subscription on user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_subscription'
  ) THEN
    CREATE TRIGGER on_auth_user_created_subscription
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_subscription();
  END IF;
END $$;

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