import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart3, Loader2, ShoppingCart, Zap, Star, Hexagon, RefreshCw, Building2, Globe, CreditCard, Search } from 'lucide-react';
import { finnhubAPI, TrendingStock } from '../lib/finnhub';
import { UserPortfolio } from '../lib/database';
import { TradingModal } from './TradingModal';
import { StockSearch } from './StockSearch';
import { StockDetail } from './StockDetail';
import { NavBar } from './NavBar';
import { LoadingScreen } from './LoadingScreen';

interface StockMarketProps {
  onBack: () => void;
  portfolio: UserPortfolio | null;
  onTransactionComplete: () => void;
}

export const StockMarket: React.FC<StockMarketProps> = ({ onBack, portfolio, onTransactionComplete }) => {
  const [stocks, setStocks] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStock, setSelectedStock] = useState<TrendingStock | null>(null);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [showStockDetail, setShowStockDetail] = useState(false);
  const [detailStock, setDetailStock] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load trending stocks only on page load
  useEffect(() => {
    loadTrendingStocks();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const loadTrendingStocks = async () => {
    try {
      setLoading(true);
      const trendingStocks = await finnhubAPI.getTrendingStocks();
      setStocks(trendingStocks);
    } catch (error) {
      // Error handling without console.error
    } finally {
      setLoading(false);
    }
  };

  const refreshStockData = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      const trendingStocks = await finnhubAPI.getTrendingStocks();
      setStocks(trendingStocks);
    } catch (error) {
      // Error handling without console.error
    } finally {
      setRefreshing(false);
    }
  };

  const handleTradeNowClick = (stock: TrendingStock) => {
    setSelectedStock(stock);
    setShowTradingModal(true);
  };

  const handleStockDetail = (stock: TrendingStock) => {
    setDetailStock(stock);
    setShowStockDetail(true);
  };

  const handleTradingComplete = () => {
    setShowTradingModal(false);
    setSelectedStock(null);
    onTransactionComplete();
  };

  const handleSearchStockSelect = (stock: any) => {
    setShowStockSearch(false);
    setDetailStock(stock);
    setShowStockDetail(true);
  };

  const handleDetailBack = () => {
    setShowStockDetail(false);
    setDetailStock(null);
  };

  const handleSearchClick = () => {
    setShowStockSearch(true);
  };

  const handleCloseSearch = () => {
    setShowStockSearch(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStockTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'common stock':
        return <BarChart3 className="w-4 h-4" />;
      case 'etf':
        return <Building2 className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStockTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'common stock':
        return 'text-blue-400';
      case 'etf':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  // Show stock detail page
  if (showStockDetail && detailStock) {
    return (
      <StockDetail
        stock={detailStock}
        onBack={handleDetailBack}
        portfolio={portfolio}
        onTransactionComplete={onTransactionComplete}
      />
    );
  }

  if (loading) {
    return <LoadingScreen message="Loading trending stocks..." />;
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, #131720 0%, #0D1117 50%, #131720 100%),
          radial-gradient(ellipse at center, rgba(255, 255, 255, 0.02) 0%, transparent 70%)
        `,
        backgroundAttachment: 'fixed'
      }}
    >
      {/* NavBar Component */}
      <NavBar 
        currentPage="stocks"
        onNavigate={(page) => {
          if (page === 'dashboard') {
            onBack();
          } else{
            onBack();
          }
        }}
        portfolio={portfolio}
      />

      {/* Celestial Ink Background - Fixed Attachment */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Wet Ink Swirls Texture */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 40%),
              radial-gradient(ellipse at 40% 80%, rgba(255, 255, 255, 0.06) 0%, transparent 60%)
            `,
          }}
        />

        {/* Vignette Effect */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.15) 100%)',
          }}
        />

        {/* Floating Calligraphy Stroke 1 */}
        <div
          className="absolute animate-calligraphy-morph-1"
          style={{
            left: '25%',
            top: '20%',
            width: '4vw',
            height: '8vw',
            maxWidth: '60px',
            maxHeight: '120px',
            minWidth: '30px',
            minHeight: '60px',
          }}
        >
          <svg 
            viewBox="0 0 60 120" 
            className="w-full h-full"
            style={{
              filter: 'blur(0.5px)',
            }}
          >
            <path
              d="M30 10 Q45 30 35 50 Q25 70 40 90 Q30 110 30 110"
              stroke="rgba(255, 215, 0, 0.4)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="animate-stroke-flow-1"
            />
          </svg>
        </div>

        {/* Floating Calligraphy Stroke 2 */}
        <div
          className="absolute animate-calligraphy-morph-2"
          style={{
            left: '70%',
            top: '60%',
            width: '5vw',
            height: '6vw',
            maxWidth: '75px',
            maxHeight: '90px',
            minWidth: '40px',
            minHeight: '48px',
          }}
        >
          <svg 
            viewBox="0 0 75 90" 
            className="w-full h-full"
            style={{
              filter: 'blur(0.5px)',
            }}
          >
            <path
              d="M15 20 Q50 15 60 35 Q70 55 45 70 Q20 75 15 75"
              stroke="rgba(255, 215, 0, 0.4)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              className="animate-stroke-flow-2"
            />
          </svg>
        </div>

        {/* Floating Calligraphy Stroke 3 */}
        <div
          className="absolute animate-calligraphy-morph-3"
          style={{
            left: '15%',
            top: '70%',
            width: '3vw',
            height: '5vw',
            maxWidth: '45px',
            maxHeight: '75px',
            minWidth: '25px',
            minHeight: '40px',
          }}
        >
          <svg 
            viewBox="0 0 45 75" 
            className="w-full h-full"
            style={{
              filter: 'blur(0.5px)',
            }}
          >
            <path
              d="M10 15 Q30 25 35 45 Q40 65 20 70"
              stroke="rgba(255, 215, 0, 0.4)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              className="animate-stroke-flow-3"
            />
          </svg>
        </div>

        {/* Quantum Dots */}
        {[...Array(7)].map((_, i) => (
          <div
            key={`quantum-dot-${i}`}
            className="absolute animate-quantum-pulse"
            style={{
              left: `${20 + i * 12}%`,
              top: `${15 + i * 8}%`,
              width: '3px',
              height: '3px',
              animationDelay: `${i * 0.8}s`,
              animationDuration: '4s',
            }}
          >
            <div 
              className="quantum-dot"
              style={{
                width: '100%',
                height: '100%',
                background: '#00BFFF',
                borderRadius: '50%',
                boxShadow: `
                  0 0 8px rgba(0, 191, 255, 0.6),
                  0 0 16px rgba(0, 191, 255, 0.3)
                `,
              }}
            />
          </div>
        ))}

        {/* Central Rift */}
        <div
          className="absolute animate-rift-glow"
          style={{
            left: '50%',
            top: '42.5%',
            width: '1px',
            height: '15vh',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 85, 85, 0.3) 50%, transparent 100%)',
            boxShadow: '0 0 4px rgba(255, 85, 85, 0.4)',
          }}
        />

        {/* Floating Kanji Characters */}
        <div
          className="absolute animate-kanji-float-1"
          style={{
            left: '48%',
            top: '35%',
            fontSize: '24px',
            color: 'rgba(255, 85, 85, 0.6)',
            fontFamily: 'serif',
            textShadow: '0 0 8px rgba(255, 85, 85, 0.4)',
            animationDelay: '2s',
          }}
        >
          株
        </div>

        <div
          className="absolute animate-kanji-float-2"
          style={{
            left: '52%',
            top: '65%',
            fontSize: '20px',
            color: 'rgba(255, 85, 85, 0.5)',
            fontFamily: 'serif',
            textShadow: '0 0 6px rgba(255, 85, 85, 0.3)',
            animationDelay: '8s',
          }}
        >
          金
        </div>

        {/* Reverse Gravity Ink Droplets */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`ink-droplet-${i}`}
            className="absolute animate-ink-droplet"
            style={{
              left: `${49 + i}%`,
              top: '60%',
              width: '2px',
              height: '2px',
              background: 'rgba(255, 85, 85, 0.4)',
              borderRadius: '50%',
              animationDelay: `${5 + i * 3}s`,
              animationDuration: '6s',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Stock Market
          </h1>
          <p className="text-gray-300 text-lg">
            Discover and trade trending stocks with real-time data.
          </p>
        </div>

        {/* Search Stocks Component - Enhanced Glassmorphism */}
        <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl shadow-2xl p-6 mb-8 hover:bg-black/15 transition-all duration-300"
             style={{
               boxShadow: `
                 0 8px 32px 0 rgba(0, 0, 0, 0.4),
                 inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
                 0 0 0 1px rgba(255, 255, 255, 0.05)
               `
             }}>
          <h3 className="text-lg font-medium text-white mb-4">Search Stocks</h3>
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              onClick={handleSearchClick}
              className="block w-full pl-10 pr-4 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 cursor-pointer hover:bg-black/30 hover:border-white/40"
              placeholder="Search stocks..."
              readOnly
            />
          </div>
          <p className="text-gray-400 text-sm mt-3">
            Click to search for any stock symbol or company name.
          </p>
        </div>

        {/* Trending Stocks Section with Refresh Button */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Trending Stocks</h2>
            <button
              onClick={refreshStockData}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-black/20 backdrop-blur-sm border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Stocks'}
            </button>
          </div>
        </div>

        {/* Stock Grid - Enhanced Glassmorphism Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stocks.map((stock, index) => (
            <div
              key={stock.symbol}
              className="group backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl shadow-2xl p-6 hover:border-blue-500/50 hover:bg-black/15 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
              style={{
                boxShadow: `
                  0 8px 32px 0 rgba(0, 0, 0, 0.4),
                  inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
                  0 0 0 1px rgba(255, 255, 255, 0.05)
                `,
              }}
            >
              {/* Stock Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300 border border-blue-400/30">
                    <span className="text-blue-400 font-bold text-lg">{stock.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{stock.symbol}</h3>
                    <p className="text-gray-400 text-sm truncate max-w-32">
                      {stock.displaySymbol}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center ${getStockTypeColor(stock.type)}`}>
                  {getStockTypeIcon(stock.type)}
                </div>
              </div>

              {/* Company Name */}
              <div className="mb-4">
                <div className="text-white font-medium text-sm mb-2 line-clamp-2">
                  {stock.description || 'Company Name'}
                </div>
              </div>

              {/* Stock Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center">
                    <CreditCard className="w-3 h-3 mr-1" />
                    Currency:
                  </span>
                  <span className="text-white font-medium">{stock.currency}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center">
                    <Building2 className="w-3 h-3 mr-1" />
                    Type:
                  </span>
                  <span className={`font-medium ${getStockTypeColor(stock.type)}`}>
                    {stock.type}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center">
                    <Globe className="w-3 h-3 mr-1" />
                    Exchange:
                  </span>
                  <span className="text-white font-medium">{stock.exchange || 'US'}</span>
                </div>

                {stock.figi && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">FIGI:</span>
                    <span className="text-gray-300 font-mono text-xs">{stock.figi.slice(0, 8)}...</span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Enhanced Glassmorphic */}
              <div className="space-y-2">
                <button 
                  onClick={() => handleStockDetail(stock)}
                  className="w-full bg-black/20 backdrop-blur-sm border border-purple-500/40 hover:bg-purple-500/10 hover:border-purple-400 text-purple-400 py-3 px-4 rounded-xl font-medium transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/20"
                  style={{
                    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Details
                </button>
                <button 
                  onClick={() => handleTradeNowClick(stock)}
                  className="w-full bg-black/20 backdrop-blur-sm border border-blue-500/40 hover:bg-blue-500/10 hover:border-blue-400 text-blue-400 py-3 px-4 rounded-xl font-medium transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center hover:shadow-lg hover:shadow-blue-500/20"
                  style={{
                    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Trade Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {stocks.length === 0 && !loading && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">No stocks available</h3>
            <p className="text-gray-500">Please try refreshing the page.</p>
          </div>
        )}
      </main>

      {/* Trading Modal */}
      {showTradingModal && selectedStock && portfolio && (
        <TradingModal
          stock={selectedStock}
          portfolio={portfolio}
          onClose={() => setShowTradingModal(false)}
          onTransactionComplete={handleTradingComplete}
        />
      )}

      {/* Stock Search Modal - Only render when needed */}
      {showStockSearch && (
        <StockSearch
          onStockSelect={handleSearchStockSelect}
          onClose={handleCloseSearch}
        />
      )}

      {/* Celestial Ink Animations */}
      <style jsx>{`
        @keyframes calligraphy-morph-1 {
          0%, 100% { 
            transform: translateX(0px) translateY(0px) rotate(0deg);
            opacity: 0.4;
          }
          50% { 
            transform: translateX(8px) translateY(-5px) rotate(2deg);
            opacity: 0.6;
          }
        }

        @keyframes calligraphy-morph-2 {
          0%, 100% { 
            transform: translateX(0px) translateY(0px) rotate(0deg);
            opacity: 0.4;
          }
          33% { 
            transform: translateX(-6px) translateY(4px) rotate(-1deg);
            opacity: 0.5;
          }
          66% { 
            transform: translateX(4px) translateY(-3px) rotate(1deg);
            opacity: 0.6;
          }
        }

        @keyframes calligraphy-morph-3 {
          0%, 100% { 
            transform: translateX(0px) translateY(0px) rotate(0deg);
            opacity: 0.4;
          }
          25% { 
            transform: translateX(5px) translateY(-6px) rotate(1deg);
            opacity: 0.5;
          }
          75% { 
            transform: translateX(-3px) translateY(4px) rotate(-1deg);
            opacity: 0.6;
          }
        }

        @keyframes stroke-flow-1 {
          0%, 100% { 
            stroke-dasharray: 0 200;
            opacity: 0.4;
          }
          50% { 
            stroke-dasharray: 100 200;
            opacity: 0.6;
          }
        }

        @keyframes stroke-flow-2 {
          0%, 100% { 
            stroke-dasharray: 0 180;
            opacity: 0.4;
          }
          50% { 
            stroke-dasharray: 90 180;
            opacity: 0.6;
          }
        }

        @keyframes stroke-flow-3 {
          0%, 100% { 
            stroke-dasharray: 0 150;
            opacity: 0.4;
          }
          50% { 
            stroke-dasharray: 75 150;
            opacity: 0.6;
          }
        }

        @keyframes quantum-pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.5);
            opacity: 1;
          }
        }

        @keyframes rift-glow {
          0%, 100% { 
            opacity: 0.3;
            box-shadow: 0 0 4px rgba(255, 85, 85, 0.4);
          }
          50% { 
            opacity: 0.6;
            box-shadow: 0 0 8px rgba(255, 85, 85, 0.6);
          }
        }

        @keyframes kanji-float-1 {
          0% { 
            transform: translateY(0px);
            opacity: 0;
          }
          10% { 
            opacity: 0.6;
          }
          90% { 
            opacity: 0.6;
          }
          100% { 
            transform: translateY(-30px);
            opacity: 0;
          }
        }

        @keyframes kanji-float-2 {
          0% { 
            transform: translateY(0px);
            opacity: 0;
          }
          15% { 
            opacity: 0.5;
          }
          85% { 
            opacity: 0.5;
          }
          100% { 
            transform: translateY(-25px);
            opacity: 0;
          }
        }

        @keyframes ink-droplet {
          0% { 
            transform: translateY(0px);
            opacity: 0;
          }
          20% { 
            opacity: 0.4;
          }
          80% { 
            opacity: 0.4;
          }
          100% { 
            transform: translateY(-40px);
            opacity: 0;
          }
        }

        .animate-calligraphy-morph-1 {
          animation: calligraphy-morph-1 60s ease-in-out infinite;
        }

        .animate-calligraphy-morph-2 {
          animation: calligraphy-morph-2 60s ease-in-out infinite;
        }

        .animate-calligraphy-morph-3 {
          animation: calligraphy-morph-3 60s ease-in-out infinite;
        }

        .animate-stroke-flow-1 {
          animation: stroke-flow-1 8s ease-in-out infinite;
        }

        .animate-stroke-flow-2 {
          animation: stroke-flow-2 10s ease-in-out infinite;
        }

        .animate-stroke-flow-3 {
          animation: stroke-flow-3 12s ease-in-out infinite;
        }

        .animate-quantum-pulse {
          animation: quantum-pulse 4s ease-in-out infinite;
        }

        .animate-rift-glow {
          animation: rift-glow 6s ease-in-out infinite;
        }

        .animate-kanji-float-1 {
          animation: kanji-float-1 4s ease-out infinite;
        }

        .animate-kanji-float-2 {
          animation: kanji-float-2 4s ease-out infinite;
        }

        .animate-ink-droplet {
          animation: ink-droplet 6s ease-out infinite;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Ensure fixed background attachment works properly */
        body {
          background-attachment: fixed;
        }
      `}</style>
    </div>
  );
};