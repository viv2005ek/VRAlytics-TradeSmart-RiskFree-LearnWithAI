/*
  # Create stocks and user_stocks tables for stock tracking

  1. New Tables
    - `stocks`
      - `id` (uuid, primary key)
      - `symbol` (text, unique, not null)
      - `name` (text, not null)
      - `sector` (text)
      - `market_cap` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_stocks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `stock_id` (uuid, references stocks)
      - `shares` (numeric, not null)
      - `purchase_price` (numeric, not null)
      - `purchase_date` (timestamp, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own stock holdings
    - Allow all users to read stock information
*/

-- Create stocks table
CREATE TABLE IF NOT EXISTS stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  name text NOT NULL,
  sector text,
  market_cap numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_stocks table
CREATE TABLE IF NOT EXISTS user_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id uuid NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  shares numeric NOT NULL CHECK (shares > 0),
  purchase_price numeric NOT NULL CHECK (purchase_price > 0),
  purchase_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, stock_id, purchase_date)
);

-- Enable Row Level Security
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stocks ENABLE ROW LEVEL SECURITY;

-- Policies for stocks table (readable by all authenticated users)
CREATE POLICY "Stocks are viewable by authenticated users"
  ON stocks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Stocks can be inserted by authenticated users"
  ON stocks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for user_stocks table
CREATE POLICY "Users can view their own stock holdings"
  ON user_stocks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock holdings"
  ON user_stocks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock holdings"
  ON user_stocks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock holdings"
  ON user_stocks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_user_stocks_user_id ON user_stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stocks_stock_id ON user_stocks(stock_id);

-- Create trigger to update updated_at on stocks changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'stocks_updated_at'
  ) THEN
    CREATE TRIGGER stocks_updated_at
      BEFORE UPDATE ON stocks
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END $$;

-- Create trigger to update updated_at on user_stocks changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_stocks_updated_at'
  ) THEN
    CREATE TRIGGER user_stocks_updated_at
      BEFORE UPDATE ON user_stocks
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END $$;

-- Insert some sample stocks
INSERT INTO stocks (symbol, name, sector, market_cap) VALUES
  ('AAPL', 'Apple Inc.', 'Technology', 3000000000000),
  ('GOOGL', 'Alphabet Inc.', 'Technology', 1800000000000),
  ('MSFT', 'Microsoft Corporation', 'Technology', 2800000000000),
  ('AMZN', 'Amazon.com Inc.', 'Consumer Discretionary', 1500000000000),
  ('TSLA', 'Tesla Inc.', 'Consumer Discretionary', 800000000000),
  ('META', 'Meta Platforms Inc.', 'Technology', 750000000000),
  ('NVDA', 'NVIDIA Corporation', 'Technology', 1200000000000),
  ('JPM', 'JPMorgan Chase & Co.', 'Financial Services', 500000000000),
  ('JNJ', 'Johnson & Johnson', 'Healthcare', 450000000000),
  ('V', 'Visa Inc.', 'Financial Services', 480000000000)
ON CONFLICT (symbol) DO NOTHING;