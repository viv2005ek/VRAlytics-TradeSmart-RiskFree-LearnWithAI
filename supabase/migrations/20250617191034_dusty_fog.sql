/*
  # Fix RLS policies for user_subscription table

  1. Updates
    - Drop existing RLS policies for user_subscription table
    - Add new policies that allow users to insert and update their own subscription
    - Add policy for anon and service role to manage subscriptions
*/

-- Drop existing policies for user_subscription
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_subscription'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscription;
    DROP POLICY IF EXISTS "Users can insert their own subscription" ON user_subscription;
    DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscription;
    DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON user_subscription;
  END IF;
END $$;

-- Create new policies for user_subscription
CREATE POLICY "Users can view their own subscription"
  ON user_subscription
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON user_subscription
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'anon');

CREATE POLICY "Users can update their own subscription"
  ON user_subscription
  FOR UPDATE
  TO authenticated, anon
  USING (auth.uid() = user_id OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'anon');

CREATE POLICY "Service role can manage all subscriptions"
  ON user_subscription
  USING (auth.role() = 'service_role');

-- Drop existing policies for subscription_history
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscription_history'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own subscription history" ON subscription_history;
  END IF;
END $$;

-- Create new policies for subscription_history
CREATE POLICY "Users can view their own subscription history"
  ON subscription_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription history"
  ON subscription_history
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'anon');

CREATE POLICY "Service role can manage all subscription history"
  ON subscription_history
  USING (auth.role() = 'service_role');