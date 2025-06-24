import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, TrendingDown, Eye, Loader2, X, ArrowUpDown } from 'lucide-react';
import { WatchlistItem, databaseService } from '../lib/database';
import { finnhubAPI, StockQuote } from '../lib/finnhub';

interface WatchlistProps {
  userId: string;
  onStockClick?: (symbol: string) => void;
  className?: string;
}

interface WatchlistItemWithQuote extends WatchlistItem {
  quote?: StockQuote;
}

export const Watchlist: React.FC<WatchlistProps> = ({ 
  userId, 
  onStockClick,
  className = '' 
}) => {
  const [watchlist, setWatchlist] = useState<WatchlistItemWithQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (userId) {
      loadWatchlist();
    }
  }, [userId]);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const watchlistItems = await databaseService.getUserWatchlist(userId);
      
      // Get quotes for each watchlist item
      const watchlistWithQuotes = await Promise.all(
        watchlistItems.map(async (item) => {
          try {
            const quote = await finnhubAPI.getQuote(item.symbol);
            return { ...item, quote };
          } catch (error) {
            return item;
          }
        })
      );

      setWatchlist(watchlistWithQuotes);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sortedWatchlist = [...watchlist].sort((a, b) => {
      const aPrice = a.quote?.c || 0;
      const bPrice = b.quote?.c || 0;
      return newOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
    });
    
    setWatchlist(sortedWatchlist);
  };

  const removeFromWatchlist = async (symbol: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await databaseService.removeFromWatchlist(userId, symbol);
      setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const handleStockClick = (symbol: string) => {
    if (onStockClick) {
      onStockClick(symbol);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className={`backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl flex flex-col ${className}`}
           style={{
             boxShadow: `
               0 8px 32px 0 rgba(0, 0, 0, 0.6),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
               0 0 0 1px rgba(255, 255, 255, 0.02)
             `
           }}>
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">Watchlist</h3>
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
            <span className="text-gray-300">Loading watchlist...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl flex flex-col ${className}`}
         style={{
           boxShadow: `
             0 8px 32px 0 rgba(0, 0, 0, 0.6),
             inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
             0 0 0 1px rgba(255, 255, 255, 0.02)
           `
         }}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Watchlist</h3>
          <button
            onClick={handleSwap}
            className="flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors group"
            title={`Sort by price ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <ArrowUpDown className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
            Swap
          </button>
        </div>
      </div>

      {/* Watchlist Items with Fixed Height and Scrollbar */}
      <div className="flex-1 overflow-hidden">
        {watchlist.length === 0 ? (
          <div className="p-6 text-center">
            <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No stocks in watchlist</p>
            <p className="text-gray-500 text-sm">Add stocks to track their performance</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
            <div className="divide-y divide-white/10">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleStockClick(item.symbol)}
                  className="p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    {/* Stock Info */}
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-yellow-400 font-bold text-lg">
                          {item.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-yellow-400 font-bold text-lg">
                          {item.symbol}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {item.company_name || 'Company'}
                        </div>
                      </div>
                    </div>

                    {/* Price and Change */}
                    <div className="flex items-center">
                      <div className="text-right mr-4">
                        {item.quote ? (
                          <>
                            <div className="text-white font-bold text-lg">
                              {formatCurrency(item.quote.c)}
                            </div>
                            <div className={`flex items-center justify-end text-sm ${getChangeColor(item.quote.d)}`}>
                              {getChangeIcon(item.quote.d)}
                              <span className="ml-1">
                                {item.quote.d >= 0 ? '+' : ''}{item.quote.dp.toFixed(2)}%
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400 text-sm">Loading...</div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => removeFromWatchlist(item.symbol, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};