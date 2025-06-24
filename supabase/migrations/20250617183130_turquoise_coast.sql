/*
  # Fix RLS policies for user_subscription table

  1. Updates
    - Drop existing policies for user_subscription
    - Create new policies for user_subscription
    - Add policy for authenticated users to insert and update their own subscriptions
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