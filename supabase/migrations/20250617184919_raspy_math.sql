/*
  # Fix RLS policies for user_subscription table

  1. Updates
    - Drop existing RLS policies for user_subscription table
    - Add new policies that allow users to insert and update their own subscription
    - Add policy for anon users to insert and update subscriptions (needed for RevenueCat)
*/

-- Drop existing policies for user_subscription
DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscription;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON user_subscription;
DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscription;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON user_subscription;

-- Create new policies for user_subscription
CREATE POLICY "Users can view their own subscription"
  ON user_subscription
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON user_subscription
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON user_subscription
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow anon users to insert and update subscriptions (needed for RevenueCat)
CREATE POLICY "Anon can insert subscriptions"
  ON user_subscription
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update subscriptions"
  ON user_subscription
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon users to insert subscription history (needed for RevenueCat)
DROP POLICY IF EXISTS "Users can view their own subscription history" ON subscription_history;
DROP POLICY IF EXISTS "Anon can insert subscription history" ON subscription_history;

CREATE POLICY "Users can view their own subscription history"
  ON subscription_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anon can insert subscription history"
  ON subscription_history
  FOR INSERT
  TO anon
  WITH CHECK (true);