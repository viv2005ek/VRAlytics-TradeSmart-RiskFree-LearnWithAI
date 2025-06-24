import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, Loader2 } from 'lucide-react';
import { UserStock, databaseService } from '../lib/database';
import { finnhubAPI } from '../lib/finnhub';

interface PnLModalProps {
  userId: string;
  onClose: () => void;
  onStockClick?: (stock: UserStock) => void;
}

export const PnLModal: React.FC<PnLModalProps> = ({ userId, onClose, onStockClick }) => {
  const [stocks, setStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStocks();
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
            const costBasis = stock.avg_buy_price * stock.quantity;
            const profitLoss = totalValue - costBasis;
            const profitLossPercentage = ((currentPrice - stock.avg_buy_price) / stock.avg_buy_price) * 100;

            return {
              ...stock,
              current_price: currentPrice,
              total_value: totalValue,
              cost_basis: costBasis,
              profit_loss: profitLoss,
              profit_loss_percentage: profitLossPercentage
            };
          } catch (error) {
            const costBasis = stock.avg_buy_price * stock.quantity;
            return {
              ...stock,
              current_price: stock.avg_buy_price,
              total_value: costBasis,
              cost_basis: costBasis,
              profit_loss: 0,
              profit_loss_percentage: 0
            };
          }
        })
      );

      // Sort by P&L (highest gains first, then highest losses)
      stocksWithPrices.sort((a, b) => (b.profit_loss || 0) - (a.profit_loss || 0));
      setStocks(stocksWithPrices);
    } catch (error) {
      console.error('Error loading user stocks:', error);
    } finally {
      setLoading(false);
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

  const getBgColor = (change: number) => {
    if (change > 0) return 'bg-green-500/10 border-green-500/20';
    if (change < 0) return 'bg-red-500/10 border-red-500/20';
    return 'bg-gray-500/10 border-gray-500/20';
  };

  const totalPnL = stocks.reduce((sum, stock) => sum + (stock.profit_loss || 0), 0);
  const totalCostBasis = stocks.reduce((sum, stock) => sum + (stock.cost_basis || 0), 0);
  const totalPnLPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  const winners = stocks.filter(stock => (stock.profit_loss || 0) > 0);
  const losers = stocks.filter(stock => (stock.profit_loss || 0) < 0);
  const neutral = stocks.filter(stock => (stock.profit_loss || 0) === 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] border border-white/20 overflow-hidden"
           style={{
             boxShadow: `
               0 25px 50px -12px rgba(0, 0, 0, 0.8),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
               0 0 0 1px rgba(255, 255, 255, 0.1)
             `
           }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 border ${
              totalPnL > 0 ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30' :
              totalPnL < 0 ? 'bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-400/30' :
              'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-400/30'
            }`}>
              {totalPnL > 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> :
               totalPnL < 0 ? <TrendingDown className="w-6 h-6 text-red-400" /> :
               <BarChart3 className="w-6 h-6 text-gray-400" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Profit & Loss Analysis</h3>
              <p className="text-gray-400">Detailed P&L breakdown by stock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* P&L Summary */}
        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`backdrop-blur-sm rounded-xl p-4 border ${getBgColor(totalPnL)}`}>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Total P&L</p>
                <div className={`text-2xl font-bold ${getChangeColor(totalPnL)}`}>
                  {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                </div>
                <div className={`text-sm ${getChangeColor(totalPnL)}`}>
                  {totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Winners</p>
                <p className="text-2xl font-bold text-green-400">{winners.length}</p>
                <p className="text-xs text-green-300">
                  +{formatCurrency(winners.reduce((sum, stock) => sum + (stock.profit_loss || 0), 0))}
                </p>
              </div>
            </div>
            <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Losers</p>
                <p className="text-2xl font-bold text-red-400">{losers.length}</p>
                <p className="text-xs text-red-300">
                  {formatCurrency(losers.reduce((sum, stock) => sum + (stock.profit_loss || 0), 0))}
                </p>
              </div>
            </div>
            <div className="bg-gray-500/10 backdrop-blur-sm rounded-xl p-4 border border-gray-500/20">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Neutral</p>
                <p className="text-2xl font-bold text-gray-400">{neutral.length}</p>
                <p className="text-xs text-gray-300">No change</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed P&L List */}
        <div className="flex-1 overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
              <span className="text-gray-300">Loading P&L data...</span>
            </div>
          ) : stocks.length === 0 ? (
            <div className="p-6 text-center">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No holdings to analyze</p>
              <p className="text-gray-500 text-sm">Start trading to see your P&L</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {stocks.map((stock) => (
                <div
                  key={stock.id}
                  onClick={() => onStockClick?.(stock)}
                  className="p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    {/* Stock Info */}
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 border ${
                        (stock.profit_loss || 0) > 0 ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30' :
                        (stock.profit_loss || 0) < 0 ? 'bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-400/30' :
                        'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-400/30'
                      }`}>
                        <span className={`font-bold text-lg ${
                          (stock.profit_loss || 0) > 0 ? 'text-green-400' :
                          (stock.profit_loss || 0) < 0 ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {stock.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">
                          {stock.symbol}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {stock.quantity} shares
                        </div>
                        <div className="text-gray-500 text-xs">
                          Bought @ {formatCurrency(stock.avg_buy_price)} • Now @ {formatCurrency(stock.current_price || stock.avg_buy_price)}
                        </div>
                      </div>
                    </div>

                    {/* P&L Details */}
                    <div className="text-right">
                      <div className={`font-bold text-xl ${getChangeColor(stock.profit_loss || 0)}`}>
                        {(stock.profit_loss || 0) >= 0 ? '+' : ''}
                        {formatCurrency(stock.profit_loss || 0)}
                      </div>
                      <div className={`flex items-center justify-end text-sm ${getChangeColor(stock.profit_loss || 0)}`}>
                        {getChangeIcon(stock.profit_loss || 0)}
                        <span className="ml-1">
                          {(stock.profit_loss_percentage || 0) >= 0 ? '+' : ''}
                          {stock.profit_loss_percentage?.toFixed(2) || '0.00'}%
                        </span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        Cost: {formatCurrency(stock.cost_basis || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};