const YAHOO_API_KEY = 'b2d970b427msh5a871a7f09227b1p1f2b36jsn9b3414e03464';
const YAHOO_BASE_URL = 'https://yahoo-finance15.p.rapidapi.com/api/v2/markets/stock';

export interface YahooHistoryData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YahooStockHistory {
  symbol: string;
  data: YahooHistoryData[];
  status: string;
}

class YahooFinanceAPI {
  private baseUrl = YAHOO_BASE_URL;
  private apiKey = YAHOO_API_KEY;

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Yahoo Finance API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      throw error;
    }
  }

  async getStockHistory(
    symbol: string, 
    interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo' = '1d',
    limit: number = 100
  ): Promise<YahooStockHistory> {
    try {
      const data = await this.makeRequest<any>(
        `/history?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      // Transform the response to our format
      const historyData: YahooHistoryData[] = data.body?.map((item: any) => ({
        timestamp: item.date || Date.now(),
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        close: item.close || 0,
        volume: item.volume || 0
      })) || [];

      return {
        symbol,
        data: historyData,
        status: 'ok'
      };
    } catch (error) {
      console.error(`Error fetching history for ${symbol}:`, error);
      throw error;
    }
  }
}

export const yahooFinanceAPI = new YahooFinanceAPI();