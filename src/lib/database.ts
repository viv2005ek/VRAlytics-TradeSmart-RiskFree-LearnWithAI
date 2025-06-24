import { supabase } from './supabase';

export interface UserPortfolio {
  id: string;
  user_id: string;
  v_cash_balance: number;
  total_portfolio_value: number;
  created_at: string;
  updated_at: string;
}

export interface UserStock {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  current_price?: number;
  total_value?: number;
  profit_loss?: number;
  profit_loss_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'referral';
  quantity: number;
  price: number;
  total_amount: number;
  description: string;
  created_at: string;
}

export interface NetWorthHistory {
  id: string;
  user_id: string;
  date: string;
  net_worth: number;
  v_cash: number;
  portfolio_value: number;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  bonus_amount: number;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  company_name?: string;
  added_at: string;
  created_at: string;
}

class DatabaseService {
  // Portfolio operations
  async getUserPortfolio(userId: string): Promise<UserPortfolio | null> {
    const { data, error } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching portfolio:', error);
      return null;
    }

    return data;
  }

  async createUserPortfolio(userId: string): Promise<UserPortfolio | null> {
    const { data, error } = await supabase
      .from('user_portfolios')
      .insert({
        user_id: userId,
        v_cash_balance: 5000, // Initial $5,000
        total_portfolio_value: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating portfolio:', error);
      return null;
    }

    return data;
  }

  async updatePortfolio(userId: string, updates: Partial<UserPortfolio>): Promise<boolean> {
    const { error } = await supabase
      .from('user_portfolios')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating portfolio:', error);
      return false;
    }

    return true;
  }

  // Stock operations
  async getUserStocks(userId: string): Promise<UserStock[]> {
    const { data, error } = await supabase
      .from('user_stocks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user stocks:', error);
      return [];
    }

    return data || [];
  }

  async getUserStock(userId: string, symbol: string): Promise<UserStock | null> {
    const { data, error } = await supabase
      .from('user_stocks')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .limit(1);

    if (error) {
      console.error('Error fetching user stock:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  }

  async updateUserStock(userId: string, symbol: string, updates: Partial<UserStock>): Promise<boolean> {
    const { error } = await supabase
      .from('user_stocks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('symbol', symbol);

    if (error) {
      console.error('Error updating user stock:', error);
      return false;
    }

    return true;
  }

  async createUserStock(userStock: Omit<UserStock, 'id' | 'created_at' | 'updated_at'>): Promise<UserStock | null> {
    const { data, error } = await supabase
      .from('user_stocks')
      .insert(userStock)
      .select()
      .single();

    if (error) {
      console.error('Error creating user stock:', error);
      return null;
    }

    return data;
  }

  async deleteUserStock(userId: string, symbol: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_stocks')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol);

    if (error) {
      console.error('Error deleting user stock:', error);
      return false;
    }

    return true;
  }

  // Transaction operations
  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return null;
    }

    return data;
  }

  async getUserTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  }

  // FIXED: Net worth history - Use upsert to prevent duplicate key errors
  async addNetWorthHistory(userId: string, netWorth: number, vCash: number, portfolioValue: number): Promise<boolean> {
    try {
      // Get TODAY's date in YYYY-MM-DD format (local timezone)
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
                         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(today.getDate()).padStart(2, '0');
      
      console.log(`📊 UPSERT: Updating/inserting net worth for TODAY (${todayString}) - Historical data protected`);
      console.log(`💰 Today's net worth data:`, {
        date: todayString,
        netWorth: netWorth.toFixed(2),
        vCash: vCash.toFixed(2),
        portfolioValue: portfolioValue.toFixed(2)
      });
      
      // FIXED: Use upsert to atomically handle insert/update - prevents race conditions
      const { error } = await supabase
        .from('net_worth_history')
        .upsert({
          user_id: userId,
          date: todayString,
          net_worth: netWorth,
          v_cash: vCash,
          portfolio_value: portfolioValue
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('❌ Error upserting net worth entry:', error);
        return false;
      }

      console.log(`✅ SUCCESS: Upserted net worth entry for today (${todayString}) - No duplicate key errors`);
      return true;
    } catch (error) {
      console.error('❌ Unexpected error in addNetWorthHistory:', error);
      return false;
    }
  }

  // Enhanced: Get net worth history with date validation
  async getNetWorthHistory(userId: string, days: number = 30): Promise<NetWorthHistory[]> {
    try {
      console.log(`📊 Fetching net worth history for ${userId} (last ${days} days)`);
      
      const { data, error } = await supabase
        .from('net_worth_history')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .limit(days);

      if (error) {
        console.error('❌ Error fetching net worth history:', error);
        return [];
      }

      console.log(`📈 Retrieved ${data?.length || 0} net worth history entries`);
      
      // Log the data for debugging - show dates to verify historical data integrity
      if (data && data.length > 0) {
        console.log('📊 Net worth history dates (verifying historical data integrity):', 
          data.map(item => ({
            date: item.date,
            netWorth: item.net_worth.toFixed(2)
          }))
        );
        
        // Verify no duplicate dates
        const dates = data.map(item => item.date);
        const uniqueDates = [...new Set(dates)];
        if (dates.length !== uniqueDates.length) {
          console.warn('⚠️ WARNING: Duplicate dates found in net worth history');
        } else {
          console.log('✅ VERIFIED: No duplicate dates in net worth history');
        }
      }

      return data || [];
    } catch (error) {
      console.error('❌ Unexpected error fetching net worth history:', error);
      return [];
    }
  }

  // Watchlist operations
  async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }

    return data || [];
  }

  async addToWatchlist(userId: string, symbol: string, companyName?: string): Promise<WatchlistItem | null> {
    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        user_id: userId,
        symbol: symbol,
        company_name: companyName
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding to watchlist:', error);
      return null;
    }

    return data;
  }

  async removeFromWatchlist(userId: string, symbol: string): Promise<boolean> {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol);

    if (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }

    return true;
  }

  async isInWatchlist(userId: string, symbol: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .maybeSingle();

    if (error) {
      return false;
    }

    return !!data;
  }

  // Referral operations
  async createReferral(referrerId: string, referredId: string): Promise<boolean> {
    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        bonus_amount: 1000,
        status: 'completed'
      });

    if (error) {
      console.error('Error creating referral:', error);
      return false;
    }

    // Add bonus to referrer's account
    const portfolio = await this.getUserPortfolio(referrerId);
    if (portfolio) {
      await this.updatePortfolio(referrerId, {
        v_cash_balance: portfolio.v_cash_balance + 1000
      });

      // Create transaction record
      await this.createTransaction({
        user_id: referrerId,
        symbol: '',
        type: 'referral',
        quantity: 0,
        price: 0,
        total_amount: 1000,
        description: 'Referral bonus'
      });
    }

    return true;
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      return [];
    }

    return data || [];
  }
}

export const databaseService = new DatabaseService();