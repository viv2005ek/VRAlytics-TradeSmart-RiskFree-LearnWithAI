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
    DROP POLICY IF EXISTS "Anon can insert subscriptions" ON user_subscription;
    DROP POLICY IF EXISTS "Anon can update subscriptions" ON user_subscription;
  END IF;
END $$;

-- Create new policies for user_subscription
CREATE POLICY "Anyone can view user_subscription"
  ON user_subscription
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert user_subscription"
  ON user_subscription
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update user_subscription"
  ON user_subscription
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for subscription_history
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscription_history'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own subscription history" ON subscription_history;
    DROP POLICY IF EXISTS "Users can insert their own subscription history" ON subscription_history;
    DROP POLICY IF EXISTS "Anon can insert subscription history" ON subscription_history;
    DROP POLICY IF EXISTS "Service role can manage all subscription history" ON subscription_history;
  END IF;
END $$;

-- Create new policies for subscription_history
CREATE POLICY "Anyone can view subscription_history"
  ON subscription_history
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert subscription_history"
  ON subscription_history
  FOR INSERT
  WITH CHECK (true);