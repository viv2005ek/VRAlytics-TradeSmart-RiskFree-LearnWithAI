import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { UserPortfolio, databaseService } from '../lib/database';
import { TrendingStock, finnhubAPI, StockQuote, CompanyProfile } from '../lib/finnhub';

interface TradingModalProps {
  stock: TrendingStock | any;
  portfolio: UserPortfolio;
  onClose: () => void;
  onTransactionComplete: () => void;
}

export const TradingModal: React.FC<TradingModalProps> = ({
  stock,
  portfolio,
  onClose,
  onTransactionComplete
}) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [userStock, setUserStock] = useState<any>(null);
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [stockProfile, setStockProfile] = useState<CompanyProfile | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);

  useEffect(() => {
    loadUserStock();
    loadStockData();
  }, []);

  const loadUserStock = async () => {
    const existingStock = await databaseService.getUserStock(portfolio.user_id, stock.symbol);
    setUserStock(existingStock);
  };

  const loadStockData = async () => {
    try {
      setLoadingQuote(true);
      
      // Use trading API key for quote and profile
      const [quote, profile] = await Promise.all([
        finnhubAPI.getQuoteForTrading(stock.symbol),
        finnhubAPI.getProfileForTrading(stock.symbol).catch(() => null)
      ]);
      
      setStockQuote(quote);
      setStockProfile(profile);
      
    } catch (error) {
      setError('Failed to load current stock price. Please try again.');
    } finally {
      setLoadingQuote(false);
    }
  };

  const currentPrice = stockQuote?.c || 0;
  const quantityNum = parseInt(quantity) || 0;
  const totalCost = currentPrice * quantityNum;
  const maxBuyQuantity = Math.floor(portfolio.v_cash_balance / currentPrice);
  const maxSellQuantity = userStock?.quantity || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const validateTrade = () => {
    setError('');

    if (!quantity || quantityNum <= 0) {
      setError('Please enter a valid quantity');
      return false;
    }

    if (tradeType === 'buy') {
      if (totalCost > portfolio.v_cash_balance) {
        setError('Insufficient funds');
        return false;
      }
      if (quantityNum > maxBuyQuantity) {
        setError(`Maximum quantity you can buy: ${maxBuyQuantity}`);
        return false;
      }
    } else {
      if (quantityNum > maxSellQuantity) {
        setError(`You only own ${maxSellQuantity} shares`);
        return false;
      }
    }

    return true;
  };

  const handleTrade = async () => {
    if (!validateTrade()) return;

    setLoading(true);
    setError('');

    try {
      if (tradeType === 'buy') {
        await handleBuy();
      } else {
        await handleSell();
      }

      setSuccess(`Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${stock.symbol}`);
      
      setTimeout(() => {
        onTransactionComplete();
      }, 1500);

    } catch (error) {
      setError('Failed to execute trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    // Update portfolio cash
    const newCashBalance = portfolio.v_cash_balance - totalCost;
    await databaseService.updatePortfolio(portfolio.user_id, {
      v_cash_balance: newCashBalance
    });

    // Update or create user stock
    if (userStock) {
      const newQuantity = userStock.quantity + quantityNum;
      const newAvgPrice = ((userStock.avg_buy_price * userStock.quantity) + totalCost) / newQuantity;
      
      await databaseService.updateUserStock(portfolio.user_id, stock.symbol, {
        quantity: newQuantity,
        avg_buy_price: newAvgPrice
      });
    } else {
      await databaseService.createUserStock({
        user_id: portfolio.user_id,
        symbol: stock.symbol,
        quantity: quantityNum,
        avg_buy_price: currentPrice
      });
    }

    // Create transaction record
    await databaseService.createTransaction({
      user_id: portfolio.user_id,
      symbol: stock.symbol,
      type: 'buy',
      quantity: quantityNum,
      price: currentPrice,
      total_amount: -totalCost,
      description: `Bought ${quantityNum} shares of ${stock.symbol} at ${formatCurrency(currentPrice)}`
    });
  };

  const handleSell = async () => {
    // Update portfolio cash
    const newCashBalance = portfolio.v_cash_balance + totalCost;
    await databaseService.updatePortfolio(portfolio.user_id, {
      v_cash_balance: newCashBalance
    });

    // Update user stock
    const newQuantity = userStock.quantity - quantityNum;
    
    if (newQuantity === 0) {
      await databaseService.deleteUserStock(portfolio.user_id, stock.symbol);
    } else {
      await databaseService.updateUserStock(portfolio.user_id, stock.symbol, {
        quantity: newQuantity
      });
    }

    // Create transaction record
    await databaseService.createTransaction({
      user_id: portfolio.user_id,
      symbol: stock.symbol,
      type: 'sell',
      quantity: quantityNum,
      price: currentPrice,
      total_amount: totalCost,
      description: `Sold ${quantityNum} shares of ${stock.symbol} at ${formatCurrency(currentPrice)}`
    });
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            {stockProfile?.logo ? (
              <img 
                src={stockProfile.logo} 
                alt={`${stock.symbol} logo`}
                className="w-12 h-12 rounded-lg mr-3"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-400 font-bold text-lg">{stock.symbol.charAt(0)}</span>
              </div>
            )}
            <div>
              <h3 className="text-white font-bold text-lg">{stock.symbol}</h3>
              <p className="text-gray-400 text-sm">{stockProfile?.name || stock.description || 'Company'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stock Info */}
        <div className="p-6 border-b border-gray-700">
          {loadingQuote ? (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Loading current price...</p>
            </div>
          ) : stockQuote ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(currentPrice)}
                  </div>
                  <div className={`flex items-center text-sm ${getChangeColor(stockQuote.d)}`}>
                    {getChangeIcon(stockQuote.d)}
                    <span className="ml-1">
                      {stockQuote.d >= 0 ? '+' : ''}{formatCurrency(stockQuote.d)} ({stockQuote.dp >= 0 ? '+' : ''}{stockQuote.dp.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div>High: <span className="text-white">{formatCurrency(stockQuote.h)}</span></div>
                  <div>Low: <span className="text-white">{formatCurrency(stockQuote.l)}</span></div>
                </div>
              </div>

              {userStock && (
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Your Position</div>
                  <div className="flex justify-between text-white">
                    <span>{userStock.quantity} shares</span>
                    <span>Avg: {formatCurrency(userStock.avg_buy_price)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-400 text-sm">Failed to load current price</p>
            </div>
          )}
        </div>

        {/* Trading Form */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-green-400 font-medium">{success}</p>
            </div>
          ) : !stockQuote ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Unable to load trading data</p>
              <button
                onClick={loadStockData}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Trade Type Selector */}
              <div className="flex mb-6">
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 py-3 px-4 rounded-l-lg font-medium transition-colors ${
                    tradeType === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  disabled={!userStock || userStock.quantity === 0}
                  className={`flex-1 py-3 px-4 rounded-r-lg font-medium transition-colors ${
                    tradeType === 'sell'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Quantity Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={tradeType === 'buy' ? maxBuyQuantity : maxSellQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="block w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter quantity"
                  />
                  <button
                    onClick={() => setQuantity(String(tradeType === 'buy' ? maxBuyQuantity : maxSellQuantity))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm hover:text-blue-300"
                  >
                    Max
                  </button>
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  Max: {tradeType === 'buy' ? maxBuyQuantity : maxSellQuantity} shares
                </div>
              </div>

              {/* Order Summary */}
              {quantityNum > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Total {tradeType === 'buy' ? 'Cost' : 'Proceeds'}:</span>
                    <span className="text-white font-bold">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Available Cash:</span>
                    <span className="text-white">{formatCurrency(portfolio.v_cash_balance)}</span>
                  </div>
                  {tradeType === 'buy' && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400">Remaining Cash:</span>
                      <span className={`${portfolio.v_cash_balance - totalCost >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(portfolio.v_cash_balance - totalCost)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center p-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Trade Button */}
              <button
                onClick={handleTrade}
                disabled={loading || !quantity || quantityNum <= 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  tradeType === 'buy'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5 mr-2" />
                    {tradeType === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};