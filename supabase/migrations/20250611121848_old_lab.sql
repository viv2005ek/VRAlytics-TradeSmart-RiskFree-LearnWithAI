/*
  # Create comprehensive trading system tables

  1. New Tables
    - `user_portfolios`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `v_cash_balance` (numeric, default 5000)
      - `total_portfolio_value` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_stocks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `symbol` (text, not null)
      - `quantity` (numeric, not null)
      - `avg_buy_price` (numeric, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `symbol` (text, not null)
      - `type` (text, not null) -- 'buy', 'sell', 'referral'
      - `quantity` (numeric, not null)
      - `price` (numeric, not null)
      - `total_amount` (numeric, not null)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `net_worth_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date, not null)
      - `net_worth` (numeric, not null)
      - `v_cash` (numeric, not null)
      - `portfolio_value` (numeric, not null)
      - `created_at` (timestamp)
    
    - `referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references auth.users)
      - `referred_id` (uuid, references auth.users)
      - `bonus_amount` (numeric, default 1000)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
    - Add indexes for better performance
*/

-- Create user_portfolios table
CREATE TABLE IF NOT EXISTS user_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  v_cash_balance numeric DEFAULT 5000 CHECK (v_cash_balance >= 0),
  total_portfolio_value numeric DEFAULT 0 CHECK (total_portfolio_value >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_stocks table
CREATE TABLE IF NOT EXISTS user_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  avg_buy_price numeric NOT NULL CHECK (avg_buy_price > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  type text NOT NULL CHECK (type IN ('buy', 'sell', 'referral')),
  quantity numeric NOT NULL CHECK (quantity >= 0),
  price numeric NOT NULL CHECK (price >= 0),
  total_amount numeric NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create net_worth_history table
CREATE TABLE IF NOT EXISTS net_worth_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  net_worth numeric NOT NULL CHECK (net_worth >= 0),
  v_cash numeric NOT NULL CHECK (v_cash >= 0),
  portfolio_value numeric NOT NULL CHECK (portfolio_value >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_amount numeric DEFAULT 1000 CHECK (bonus_amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Enable Row Level Security
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policies for user_portfolios
CREATE POLICY "Users can view their own portfolio"
  ON user_portfolios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio"
  ON user_portfolios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio"
  ON user_portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_stocks
CREATE POLICY "Users can view their own stocks"
  ON user_stocks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stocks"
  ON user_stocks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stocks"
  ON user_stocks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stocks"
  ON user_stocks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for net_worth_history
CREATE POLICY "Users can view their own net worth history"
  ON net_worth_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own net worth history"
  ON net_worth_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own net worth history"
  ON net_worth_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for referrals
CREATE POLICY "Users can view referrals they made"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals they received"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals they make"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stocks_user_id ON user_stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stocks_symbol ON user_stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_id ON net_worth_history(user_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_history_date ON net_worth_history(date);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- Create triggers to update updated_at timestamps
CREATE TRIGGER user_portfolios_updated_at
  BEFORE UPDATE ON user_portfolios
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER user_stocks_updated_at
  BEFORE UPDATE ON user_stocks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to automatically create portfolio on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_portfolio()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_portfolios (user_id, v_cash_balance, total_portfolio_value)
  VALUES (new.id, 5000, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create portfolio on user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_portfolio'
  ) THEN
    CREATE TRIGGER on_auth_user_created_portfolio
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_portfolio();
  END IF;
END $$;