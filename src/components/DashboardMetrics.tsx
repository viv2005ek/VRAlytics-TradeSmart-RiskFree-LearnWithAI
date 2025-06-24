import React, { useState, useEffect } from 'react';
import { DollarSign, BarChart3, TrendingUp, Wallet, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { UserPortfolio, UserStock, databaseService } from '../lib/database';
import { finnhubAPI } from '../lib/finnhub';
import { VCashModal } from './VCashModal';
import { PortfolioModal } from './PortfolioModal';
import { PnLModal } from './PnLModal';

interface DashboardMetricsProps {
  userId: string;
  portfolio: UserPortfolio | null;
  className?: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ 
  userId, 
  portfolio,
  className = '' 
}) => {
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalPnLPercentage, setTotalPnLPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showVCashModal, setShowVCashModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showPnLModal, setShowPnLModal] = useState(false);

  useEffect(() => {
    if (userId && portfolio) {
      calculatePortfolioMetrics();
    }
  }, [userId, portfolio]);

  const calculatePortfolioMetrics = async () => {
    try {
      setLoading(true);
      const userStocks = await databaseService.getUserStocks(userId);
      
      let totalCurrentValue = 0;
      let totalCostBasis = 0;

      // Calculate current portfolio value and P&L
      for (const stock of userStocks) {
        try {
          const quote = await finnhubAPI.getQuote(stock.symbol);
          const currentValue = quote.c * stock.quantity;
          const costBasis = stock.avg_buy_price * stock.quantity;
          
          totalCurrentValue += currentValue;
          totalCostBasis += costBasis;
        } catch (error) {
          // If we can't get current price, use the average buy price
          const fallbackValue = stock.avg_buy_price * stock.quantity;
          totalCurrentValue += fallbackValue;
          totalCostBasis += fallbackValue;
        }
      }

      setPortfolioValue(totalCurrentValue);
      
      const pnl = totalCurrentValue - totalCostBasis;
      setTotalPnL(pnl);
      
      const pnlPercentage = totalCostBasis > 0 ? (pnl / totalCostBasis) * 100 : 0;
      setTotalPnLPercentage(pnlPercentage);

    } catch (error) {
      console.error('Error calculating portfolio metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    await calculatePortfolioMetrics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    if (!balanceVisible) return '••••••';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    if (!balanceVisible) return '••••';
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const totalNetWorth = (portfolio?.v_cash_balance || 0) + portfolioValue;

  const metrics = [
    {
      title: 'V-Cash Balance',
      value: formatCurrency(portfolio?.v_cash_balance || 0),
      icon: DollarSign,
      iconColor: 'text-blue-400',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
      onClick: () => setShowVCashModal(true),
      clickable: true
    },
    {
      title: 'Portfolio Value',
      value: formatCurrency(portfolioValue),
      icon: BarChart3,
      iconColor: 'text-purple-400',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20',
      onClick: () => setShowPortfolioModal(true),
      clickable: true
    },
    {
      title: 'Total P&L',
      value: formatCurrency(totalPnL),
      change: formatPercentage(totalPnLPercentage),
      icon: TrendingUp,
      iconColor: totalPnL >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: totalPnL >= 0 ? 'from-green-500/10 to-emerald-500/10' : 'from-red-500/10 to-pink-500/10',
      borderColor: totalPnL >= 0 ? 'border-green-500/20' : 'border-red-500/20',
      changeColor: totalPnL >= 0 ? 'text-green-400' : 'text-red-400',
      onClick: () => setShowPnLModal(true),
      clickable: true
    },
    {
      title: 'Total Net Worth',
      value: formatCurrency(totalNetWorth),
      icon: Wallet,
      iconColor: 'text-yellow-400',
      bgColor: 'from-yellow-500/10 to-orange-500/10',
      borderColor: 'border-yellow-500/20',
      clickable: false
    }
  ];

  return (
    <>
      <div className={`${className}`}>
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Portfolio Overview</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefreshPrices}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Prices'}
            </button>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="flex items-center px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-500/30 rounded-xl text-gray-400 hover:bg-gray-500/10 hover:border-gray-400 transition-all duration-300 transform hover:scale-105"
            >
              {balanceVisible ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Balance
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Balance
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div
              key={metric.title}
              onClick={metric.clickable ? metric.onClick : undefined}
              className={`bg-gradient-to-br ${metric.bgColor} backdrop-blur-sm rounded-xl p-6 border ${metric.borderColor} transition-all duration-300 shadow-lg hover:shadow-xl ${
                metric.clickable 
                  ? 'cursor-pointer hover:scale-105 hover:bg-opacity-80 transform' 
                  : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gray-800/50 rounded-lg flex items-center justify-center ${metric.iconColor}`}>
                  <metric.icon className="w-6 h-6" />
                </div>
                {metric.clickable && (
                  <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click for details
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">
                  {metric.title}
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-white text-2xl font-bold">
                    {loading && index !== 0 ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      metric.value
                    )}
                  </p>
                </div>
                {metric.change && (
                  <p className={`text-sm font-medium mt-1 ${metric.changeColor}`}>
                    {loading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      metric.change
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showVCashModal && (
        <VCashModal
          userId={userId}
          vCashBalance={portfolio?.v_cash_balance || 0}
          onClose={() => setShowVCashModal(false)}
        />
      )}

      {showPortfolioModal && (
        <PortfolioModal
          userId={userId}
          onClose={() => setShowPortfolioModal(false)}
        />
      )}

      {showPnLModal && (
        <PnLModal
          userId={userId}
          onClose={() => setShowPnLModal(false)}
        />
      )}
    </>
  );
};