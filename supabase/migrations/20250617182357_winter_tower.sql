/*
  # Fix RLS policies for user_subscription table

  1. Updates
    - Drop existing RLS policies for user_subscription table
    - Add new policies that allow users to insert and update their own subscription
    - Fix mock purchase functionality in RevenueCat integration
*/

-- Drop existing policies for user_subscription
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_subscription' AND policyname = 'Users can view their own subscription'
  ) THEN
    DROP POLICY "Users can view their own subscription" ON user_subscription;
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
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON user_subscription
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for service role to manage subscriptions
CREATE POLICY "Service role can manage all subscriptions"
  ON user_subscription
  USING (auth.role() = 'service_role');