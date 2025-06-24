// Enhanced Finnhub API with multiple API keys for different actions
const API_KEYS = {
  dashboard: 'd14lqchr01qq13os2bmgd14lqchr01qq13os2bn0',
  trending: 'd14n6o9r01qq13osa3q0d14n6o9r01qq13osa3qg',
  search: 'd14n7ghr01qq13osa8d0d14n7ghr01qq13osa8dg',
  details: 'd14n811r01qq13osabagd14n811r01qq13osabb0',
  trading: 'd14n6o9r01qq13osa3q0d14n6o9r01qq13osa3qg'
};

const BASE_URL = 'https://finnhub.io/api/v1';

export interface StockQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface StockCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status
  t: number[]; // Timestamps
  v: number[]; // Volume
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export interface StockSymbol {
  currency: string;
  description: string;
  displaySymbol: string;
  figi: string;
  mic: string;
  symbol: string;
  type: string;
}

export interface TrendingStock {
  symbol: string;
  description: string;
  currency: string;
  displaySymbol: string;
  type: string;
  figi: string;
  mic: string;
  exchange?: string;
  quote?: StockQuote;
  profile?: CompanyProfile;
}

export interface SearchResult {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export interface CompanyNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface TechnicalIndicator {
  s: string; // Status
  t: number[]; // Timestamps
  [key: string]: any; // Indicator values
}

class FinnhubAPI {
  private baseUrl = BASE_URL;
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 60;

  private async makeRequest<T>(endpoint: string, apiKeyType: keyof typeof API_KEYS, action: string): Promise<T> {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded. Please wait a moment.');
    }

    this.requestCount++;

    const apiKey = API_KEYS[apiKeyType];
    const lastTwoDigits = apiKey.slice(-2);
    
    // Only log when actually making the fetch request
    console.log(`🔑 API Key ending in "${lastTwoDigits}" used for ${action}`);

    const url = `${this.baseUrl}${endpoint}&token=${apiKey}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Dashboard API calls
  async getQuote(symbol: string): Promise<StockQuote> {
    return this.makeRequest<StockQuote>(`/quote?symbol=${symbol}`, 'dashboard', 'dashboard quote fetch');
  }

  // Trending stocks API calls
  async getStockSymbols(exchange: string = 'US'): Promise<StockSymbol[]> {
    return this.makeRequest<StockSymbol[]>(`/stock/symbol?exchange=${exchange}`, 'trending', 'trending stocks fetch');
  }

  async getTrendingStocks(): Promise<TrendingStock[]> {
    try {
      const allSymbols = await this.getStockSymbols('US');
      
      const popularSymbols = [
        'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 
        'META', 'NVDA', 'JPM', 'JNJ', 'V',
        'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL',
        'BAC', 'NFLX', 'ADBE', 'CRM', 'INTC',
        'CSCO', 'PFE', 'KO', 'PEP', 'WMT'
      ];

      const trendingStocks: TrendingStock[] = allSymbols
        .filter(symbolData => 
          popularSymbols.includes(symbolData.symbol) && 
          symbolData.type === 'Common Stock'
        )
        .slice(0, 24)
        .map(symbolData => ({
          symbol: symbolData.symbol,
          description: symbolData.description,
          currency: symbolData.currency,
          displaySymbol: symbolData.displaySymbol,
          type: symbolData.type,
          figi: symbolData.figi,
          mic: symbolData.mic,
          exchange: 'US'
        }));
      
      return trendingStocks;
    } catch (error) {
      throw error;
    }
  }

  // Search API calls
  async searchStocks(query: string): Promise<SearchResult> {
    return this.makeRequest<SearchResult>(`/search?q=${query}`, 'search', 'stock search');
  }

  // Stock details API calls
  async getStockQuote(symbol: string): Promise<StockQuote> {
    return this.makeRequest<StockQuote>(`/quote?symbol=${symbol}`, 'details', 'stock detail quote');
  }

  async getStockProfile(symbol: string): Promise<CompanyProfile> {
    return this.makeRequest<CompanyProfile>(`/stock/profile2?symbol=${symbol}`, 'details', 'company profile');
  }

  async getStockCandles(
    symbol: string,
    resolution: string = 'D',
    from: number,
    to: number
  ): Promise<StockCandle> {
    return this.makeRequest<StockCandle>(
      `/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`,
      'details',
      'stock candles'
    );
  }

  async getCompanyNews(symbol: string, from: string, to: string): Promise<CompanyNews[]> {
    return this.makeRequest<CompanyNews[]>(
      `/company-news?symbol=${symbol}&from=${from}&to=${to}`,
      'details',
      'company news'
    );
  }

  async getTechnicalIndicator(
    symbol: string,
    resolution: string = 'D',
    indicator: string = 'rsi',
    timeperiod: number = 14
  ): Promise<TechnicalIndicator> {
    return this.makeRequest<TechnicalIndicator>(
      `/indicator?symbol=${symbol}&resolution=${resolution}&indicator=${indicator}&timeperiod=${timeperiod}`,
      'details',
      'technical indicator'
    );
  }

  // Trading API calls
  async getQuoteForTrading(symbol: string): Promise<StockQuote> {
    return this.makeRequest<StockQuote>(`/quote?symbol=${symbol}`, 'trading', 'trading quote');
  }

  async getProfileForTrading(symbol: string): Promise<CompanyProfile> {
    return this.makeRequest<CompanyProfile>(`/stock/profile2?symbol=${symbol}`, 'trading', 'trading profile');
  }

  getPopularStocks(): string[] {
    return [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 
      'META', 'NVDA', 'JPM', 'JNJ', 'V',
      'PG', 'UNH', 'HD', 'MA', 'DIS',
      'PYPL', 'BAC', 'NFLX', 'ADBE', 'CRM'
    ];
  }
}

export const finnhubAPI = new FinnhubAPI();