import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Loader2, ArrowUpDown } from 'lucide-react';
import { UserStock, databaseService } from '../lib/database';
import { finnhubAPI } from '../lib/finnhub';

interface PortfolioHoldingsProps {
  userId: string;
  onStockClick?: (stock: UserStock) => void;
  className?: string;
}

export const PortfolioHoldings: React.FC<PortfolioHoldingsProps> = ({ 
  userId, 
  onStockClick,
  className = '' 
}) => {
  const [stocks, setStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (userId) {
      loadUserStocks();
    }
  }, [userId]);

  const loadUserStocks = async () => {
    try {
      setLoading(true);
      const userStocks = await databaseService.getUserStocks(userId);
      
      // Update current prices for each stock
      const stocksWithPrices = await Promise.all(
        userStocks.map(async (stock) => {
          try {
            const quote = await finnhubAPI.getQuote(stock.symbol);
            const currentPrice = quote.c;
            const totalValue = currentPrice * stock.quantity;
            const profitLoss = totalValue - (stock.avg_buy_price * stock.quantity);
            const profitLossPercentage = ((currentPrice - stock.avg_buy_price) / stock.avg_buy_price) * 100;

            return {
              ...stock,
              current_price: currentPrice,
              total_value: totalValue,
              profit_loss: profitLoss,
              profit_loss_percentage: profitLossPercentage
            };
          } catch (error) {
            return {
              ...stock,
              current_price: stock.avg_buy_price,
              total_value: stock.avg_buy_price * stock.quantity,
              profit_loss: 0,
              profit_loss_percentage: 0
            };
          }
        })
      );

      setStocks(stocksWithPrices);
    } catch (error) {
      console.error('Error loading user stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sortedStocks = [...stocks].sort((a, b) => {
      const aValue = a.total_value || 0;
      const bValue = b.total_value || 0;
      return newOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    setStocks(sortedStocks);
  };

  const handleStockClick = (stock: UserStock) => {
    // Convert UserStock to the format expected by StockDetail
    const stockForDetail = {
      symbol: stock.symbol,
      description: `${stock.symbol} Stock`,
      currency: 'USD',
      displaySymbol: stock.symbol,
      type: 'Common Stock'
    };
    
    if (onStockClick) {
      onStockClick(stockForDetail as any);
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
          <h3 className="text-xl font-bold text-white">Portfolio Holdings</h3>
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
            <span className="text-gray-300">Loading portfolio...</span>
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
          <h3 className="text-xl font-bold text-white">Portfolio Holdings</h3>
          <button
            onClick={handleSwap}
            className="flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors group"
            title={`Sort by value ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <ArrowUpDown className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
            Swap
          </button>
        </div>
      </div>

      {/* Holdings List with Fixed Height and Scrollbar */}
      <div className="flex-1 overflow-hidden">
        {stocks.length === 0 ? (
          <div className="p-6 text-center">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No holdings yet</p>
            <p className="text-gray-500 text-sm">Start trading to build your portfolio</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
            <div className="divide-y divide-white/10">
              {stocks.map((stock) => (
                <div
                  key={stock.id}
                  onClick={() => handleStockClick(stock)}
                  className="p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    {/* Stock Info */}
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-blue-400 font-bold text-lg">
                          {stock.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-blue-400 font-bold text-lg">
                          {stock.symbol}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {stock.quantity} shares
                        </div>
                      </div>
                    </div>

                    {/* Value and Change */}
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">
                        {formatCurrency(stock.total_value || 0)}
                      </div>
                      <div className={`flex items-center justify-end text-sm ${getChangeColor(stock.profit_loss || 0)}`}>
                        {getChangeIcon(stock.profit_loss || 0)}
                        <span className="ml-1">
                          {stock.profit_loss && stock.profit_loss >= 0 ? '+' : ''}
                          {stock.profit_loss_percentage?.toFixed(2) || '0.00'}%
                        </span>
                      </div>
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