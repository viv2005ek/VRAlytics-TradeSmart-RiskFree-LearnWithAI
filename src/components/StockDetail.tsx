import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Globe, 
  Calendar,
  Users,
  Building2,
  ExternalLink,
  ShoppingCart,
  Heart,
  AlertCircle,
  Star,
  Zap,
  Activity,
  Phone,
  MapPin,
  CreditCard
} from 'lucide-react';
import { finnhubAPI, StockQuote, CompanyProfile, CompanyNews } from '../lib/finnhub';
import { UserPortfolio, databaseService } from '../lib/database';
import { TradingModal } from './TradingModal';
import { DualModeChart } from './DualModeChart';
import { useAuth } from '../auth/AuthProvider';
import { NavBar } from './NavBar';
import { LoadingScreen } from './LoadingScreen';

interface StockDetailProps {
  stock: any;
  onBack: () => void;
  portfolio: UserPortfolio | null;
  onTransactionComplete: () => void;
}

export const StockDetail: React.FC<StockDetailProps> = ({ 
  stock, 
  onBack, 
  portfolio, 
  onTransactionComplete 
}) => {
  const { user } = useAuth();
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [news, setNews] = useState<CompanyNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [timeframe, setTimeframe] = useState<'1D' | '1M' | '1Y'>('1D');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStockData();
    checkWatchlistStatus();
  }, [stock.symbol]);

  const loadStockData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch quote and profile in parallel
      const [quoteData, profileData] = await Promise.all([
        finnhubAPI.getStockQuote(stock.symbol),
        finnhubAPI.getStockProfile(stock.symbol).catch(() => null)
      ]);
      
      setQuote(quoteData);
      setProfile(profileData);
      
      // Fetch recent news
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newsData = await finnhubAPI.getCompanyNews(
        stock.symbol,
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      ).catch(() => []);
      
      setNews(newsData.slice(0, 3)); // Show only top 3 news items
      
    } catch (error) {
      setError('Failed to load stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlistStatus = async () => {
    if (!user) return;
    
    try {
      const inWatchlist = await databaseService.isInWatchlist(user.id, stock.symbol);
      setIsInWatchlist(inWatchlist);
    } catch (error) {
      // Error checking watchlist status
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user || watchlistLoading) return;

    try {
      setWatchlistLoading(true);
      
      if (isInWatchlist) {
        await databaseService.removeFromWatchlist(user.id, stock.symbol);
        setIsInWatchlist(false);
      } else {
        await databaseService.addToWatchlist(
          user.id, 
          stock.symbol, 
          profile?.name || stock.description
        );
        setIsInWatchlist(true);
      }
    } catch (error) {
      // Error toggling watchlist
    } finally {
      setWatchlistLoading(false);
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

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-5 h-5" />;
    if (change < 0) return <TrendingDown className="w-5 h-5" />;
    return null;
  };

  const handleTrade = () => {
    setShowTradingModal(true);
  };

  const handleTradingComplete = () => {
    setShowTradingModal(false);
    onTransactionComplete();
  };

  if (loading) {
    return <LoadingScreen message={`Loading ${stock.symbol} details...`} subMessage="Fetching real-time data" />;
  }

  if (error) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg, #131720 0%, #0D1117 50%, #131720 100%),
            radial-gradient(ellipse at center, rgba(255, 255, 255, 0.02) 0%, transparent 70%)
          `,
          backgroundAttachment: 'fixed'
        }}
      >
        <NavBar 
          currentPage="stocks"
          onNavigate={(page) => {
            if (page === 'dashboard') {
              onBack();
            }else {
              onBack();
            }
          }}
          portfolio={portfolio}
        />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24">
          <div className="max-w-md w-full backdrop-blur-xl bg-black/20 border border-red-500/30 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Data</h2>
            <p className="text-red-300 mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={loadStockData}
                className="px-6 py-3 bg-black/30 backdrop-blur-sm border border-blue-500/50 rounded-xl text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 transition-all duration-300 transform hover:scale-105"
              >
                Retry
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 transform hover:scale-105"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
      {/* Dynamic NavBar Component */}
      <NavBar 
        currentPage="stocks"
        onNavigate={(page) => {
          if (page === 'dashboard') {
            onBack();
          }
        }}
        portfolio={portfolio}
      />

      {/* Floating Tiny Sparks Background - Fixed Attachment */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Tiny Sparks - Violet/Blue */}
        {[...Array(40)].map((_, i) => (
          <div
            key={`spark-${i}`}
            className="absolute animate-spark"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${0.3 + Math.random() * 0.3}%`,
              height: `${0.3 + Math.random() * 0.3}%`,
              maxWidth: '3px',
              maxHeight: '3px',
              minWidth: '1px',
              minHeight: '1px',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            <div 
              className="spark"
              style={{
                width: '100%',
                height: '100%',
                background: i % 3 === 0 ? '#8A6EFF' : i % 3 === 1 ? '#00d4ff' : '#ff5e3a',
                borderRadius: '50%',
                boxShadow: `
                  0 0 ${2 + Math.random() * 3}px ${i % 3 === 0 ? 'rgba(138, 110, 255, 0.8)' : i % 3 === 1 ? 'rgba(0, 212, 255, 0.8)' : 'rgba(255, 94, 58, 0.8)'},
                  0 0 ${4 + Math.random() * 6}px ${i % 3 === 0 ? 'rgba(138, 110, 255, 0.4)' : i % 3 === 1 ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255, 94, 58, 0.4)'}
                `,
                filter: 'blur(0.3px)',
              }}
            />
          </div>
        ))}

        {/* Tiny Hexagonal Specks with Violet Pulses */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`hex-speck-${i}`}
            className="absolute animate-hex-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${0.3 + Math.random() * 0.2}%`,
              height: `${0.3 + Math.random() * 0.2}%`,
              maxWidth: '3px',
              maxHeight: '3px',
              minWidth: '1px',
              minHeight: '1px',
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          >
            <div 
              className="hexagonal-speck"
              style={{
                width: '100%',
                height: '100%',
                background: 'rgba(138, 110, 255, 0.3)',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                boxShadow: `
                  0 0 3px rgba(138, 110, 255, 0.6),
                  0 0 6px rgba(138, 110, 255, 0.3)
                `,
                filter: 'blur(0.3px)',
              }}
            />
            {/* Connection Pulse */}
            <div 
              className="connection-pulse"
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(138, 110, 255, 0.4) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'pulse-connect 3s ease-in-out infinite',
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          </div>
        ))}

        {/* Floating Dust Particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`dust-${i}`}
            className="absolute animate-float-dust"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${0.1 + Math.random() * 0.2}%`,
              height: `${0.1 + Math.random() * 0.2}%`,
              maxWidth: '2px',
              maxHeight: '2px',
              minWidth: '1px',
              minHeight: '1px',
              opacity: 0.3 + Math.random() * 0.4,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
            }}
          >
            <div 
              className="dust-particle"
              style={{
                width: '100%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '50%',
                boxShadow: '0 0 2px rgba(255, 255, 255, 0.3)',
                filter: 'blur(0.5px)',
              }}
            />
          </div>
        ))}

        {/* Glowing Grid Points */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`grid-point-${i}`}
            className="absolute animate-grid-point"
            style={{
              left: `${(i % 5) * 25}%`,
              top: `${Math.floor(i / 5) * 25}%`,
              width: '2px',
              height: '2px',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: '4s',
            }}
          >
            <div 
              className="grid-point"
              style={{
                width: '100%',
                height: '100%',
                background: '#8A6EFF',
                borderRadius: '50%',
                boxShadow: '0 0 4px rgba(138, 110, 255, 0.6)',
              }}
            />
          </div>
        ))}

        {/* Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(138, 110, 255, 0)" />
              <stop offset="50%" stopColor="rgba(138, 110, 255, 0.2)" />
              <stop offset="100%" stopColor="rgba(138, 110, 255, 0)" />
            </linearGradient>
          </defs>
          {[...Array(10)].map((_, i) => {
            const x1 = `${Math.random() * 100}%`;
            const y1 = `${Math.random() * 100}%`;
            const x2 = `${Math.random() * 100}%`;
            const y2 = `${Math.random() * 100}%`;
            return (
              <line 
                key={`line-${i}`}
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke="url(#lineGradient)" 
                strokeWidth="0.5" 
                strokeDasharray="3,3"
                className="animate-line-pulse"
                style={{ animationDelay: `${Math.random() * 5}s` }}
              />
            );
          })}
        </svg>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Stock Header - Glassmorphism */}
        <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl p-8 mb-8 hover:bg-black/15 transition-all duration-300"
             style={{
               boxShadow: `
                 0 8px 32px 0 rgba(0, 0, 0, 0.4),
                 inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
                 0 0 0 1px rgba(255, 255, 255, 0.05)
               `
             }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {profile?.logo ? (
                <img 
                  src={profile.logo} 
                  alt={`${stock.symbol} logo`}
                  className="w-16 h-16 rounded-xl mr-6 border border-white/20"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-6 border border-white/20">
                  <span className="text-blue-400 font-bold text-2xl">{stock.symbol.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{stock.symbol}</h1>
                <p className="text-gray-300 text-lg">{profile?.name || stock.description}</p>
                <div className="flex items-center mt-2 space-x-4">
                  {profile?.exchange && (
                    <span className="flex items-center text-gray-400 text-sm bg-black/20 px-2 py-1 rounded-lg border border-white/10">
                      <Building2 className="w-4 h-4 mr-1" />
                      {profile.exchange}
                    </span>
                  )}
                  {profile?.country && (
                    <span className="flex items-center text-gray-400 text-sm bg-black/20 px-2 py-1 rounded-lg border border-white/10">
                      <Globe className="w-4 h-4 mr-1" />
                      {profile.country}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              {quote && (
                <>
                  <div className="text-4xl font-bold text-white mb-2">
                    {formatCurrency(quote.c)}
                  </div>
                  <div className={`flex items-center justify-end text-lg ${getChangeColor(quote.d)}`}>
                    {getChangeIcon(quote.d)}
                    <span className="ml-2">
                      {quote.d >= 0 ? '+' : ''}{formatCurrency(quote.d)} ({quote.dp >= 0 ? '+' : ''}{quote.dp.toFixed(2)}%)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons - No Background, Border Only */}
          <div className="flex space-x-4">
            <button
              onClick={handleTrade}
              className="flex items-center border border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 text-blue-400 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Trade
            </button>
            <button 
              onClick={handleWatchlistToggle}
              disabled={watchlistLoading}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border ${
                isInWatchlist 
                  ? 'border-yellow-500/50 hover:border-yellow-400 hover:bg-yellow-500/10 text-yellow-400' 
                  : 'border-gray-500/50 hover:border-gray-400 hover:bg-gray-500/10 text-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart className={`w-5 h-5 mr-2 ${isInWatchlist ? 'fill-current' : ''}`} />
              {watchlistLoading ? 'Loading...' : isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>
            {profile?.weburl && (
              <a
                href={profile.weburl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center border border-gray-500/50 hover:border-gray-400 hover:bg-gray-500/10 text-gray-400 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Website
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Key Metrics - Enhanced Box Structure */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl p-6 mb-8 hover:bg-black/15 transition-all duration-300"
                 style={{
                   boxShadow: `
                     0 8px 32px 0 rgba(0, 0, 0, 0.4),
                     inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
                     0 0 0 1px rgba(255, 255, 255, 0.05)
                   `
                 }}>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 mr-3 text-blue-400" />
                Key Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quote && (
                  <>
                    <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-4 text-center hover:bg-black/30 transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-400 mr-2" />
                        <p className="text-gray-400 text-sm font-medium">Open</p>
                      </div>
                      <p className="text-white font-bold text-lg">{formatCurrency(quote.o)}</p>
                    </div>
                    <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-4 text-center hover:bg-black/30 transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                        <p className="text-gray-400 text-sm font-medium">High</p>
                      </div>
                      <p className="text-green-400 font-bold text-lg">{formatCurrency(quote.h)}</p>
                    </div>
                    <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-4 text-center hover:bg-black/30 transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
                        <p className="text-gray-400 text-sm font-medium">Low</p>
                      </div>
                      <p className="text-red-400 font-bold text-lg">{formatCurrency(quote.l)}</p>
                    </div>
                    <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-4 text-center hover:bg-black/30 transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        <Activity className="w-5 h-5 text-purple-400 mr-2" />
                        <p className="text-gray-400 text-sm font-medium">Prev Close</p>
                      </div>
                      <p className="text-white font-bold text-lg">{formatCurrency(quote.pc)}</p>
                    </div>
                  </>
                )}
                {profile && (
                  <>
                    <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-4 text-center hover:bg-black/30 transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign className="w-5 h-5 text-yellow-400 mr-2" />
                        <p className="text-gray-400 text-sm font-medium">Market Cap</p>
                      </div>
                      <p className="text-white font-bold text-lg">{formatMarketCap(profile.marketCapitalization)}</p>
                    </div>
                    <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-4 text-center hover:bg-black/30 transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="w-5 h-5 text-cyan-400 mr-2" />
                        <p className="text-gray-400 text-sm font-medium">Shares Out</p>
                      </div>
                      <p className="text-white font-bold text-lg">{(profile.shareOutstanding / 1e6).toFixed(1)}M</p>
                    </div>
                    <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-4 text-center hover:bg-black/30 transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        <Building2 className="w-5 h-5 text-indigo-400 mr-2" />
                        <p className="text-gray-400 text-sm font-medium">Industry</p>
                      </div>
                      <p className="text-white font-bold text-xs">{profile.finnhubIndustry || 'N/A'}</p>
                    </div>
                    <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-4 text-center hover:bg-black/30 transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        <Calendar className="w-5 h-5 text-pink-400 mr-2" />
                        <p className="text-gray-400 text-sm font-medium">IPO Date</p>
                      </div>
                      <p className="text-white font-bold text-xs">{profile.ipo || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dual-Mode Price Chart - Glassmorphism */}
            <div className="mb-8">
              <DualModeChart
                symbol={stock.symbol}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                className="h-[500px]"
              />
            </div>
          </div>

          {/* Company Info & News */}
          <div className="space-y-8">
            {/* Company Info - Enhanced with Logos */}
            {profile && (
              <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl p-6 hover:bg-black/15 transition-all duration-300"
                   style={{
                     boxShadow: `
                       0 8px 32px 0 rgba(0, 0, 0, 0.4),
                       inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
                       0 0 0 1px rgba(255, 255, 255, 0.05)
                     `
                   }}>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Building2 className="w-6 h-6 mr-3 text-purple-400" />
                  Company Info
                </h3>
                <div className="space-y-4">
                  <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-lg p-3 hover:bg-black/30 transition-all duration-300">
                    <div className="flex items-center mb-2">
                      <Building2 className="w-4 h-4 text-blue-400 mr-2" />
                      <p className="text-gray-400 text-sm font-medium">Industry</p>
                    </div>
                    <p className="text-white">{profile.finnhubIndustry || 'N/A'}</p>
                  </div>
                  <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-lg p-3 hover:bg-black/30 transition-all duration-300">
                    <div className="flex items-center mb-2">
                      <Globe className="w-4 h-4 text-green-400 mr-2" />
                      <p className="text-gray-400 text-sm font-medium">Country</p>
                    </div>
                    <p className="text-white">{profile.country}</p>
                  </div>
                  <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-lg p-3 hover:bg-black/30 transition-all duration-300">
                    <div className="flex items-center mb-2">
                      <CreditCard className="w-4 h-4 text-yellow-400 mr-2" />
                      <p className="text-gray-400 text-sm font-medium">Currency</p>
                    </div>
                    <p className="text-white">{profile.currency}</p>
                  </div>
                  {profile.phone && (
                    <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-lg p-3 hover:bg-black/30 transition-all duration-300">
                      <div className="flex items-center mb-2">
                        <Phone className="w-4 h-4 text-cyan-400 mr-2" />
                        <p className="text-gray-400 text-sm font-medium">Phone</p>
                      </div>
                      <p className="text-white text-sm">{profile.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent News - Enhanced UI */}
            <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl p-6 hover:bg-black/15 transition-all duration-300"
                 style={{
                   boxShadow: `
                     0 8px 32px 0 rgba(0, 0, 0, 0.4),
                     inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
                     0 0 0 1px rgba(255, 255, 255, 0.05)
                   `
                 }}>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Activity className="w-6 h-6 mr-3 text-green-400" />
                Recent News
              </h3>
              {news.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recent news available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {news.map((article, index) => (
                    <div key={index} className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-lg overflow-hidden hover:bg-black/30 transition-all duration-300 hover:border-white/20">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 hover:bg-black/10 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-white/10">
                            <Activity className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm mb-2 line-clamp-2 hover:text-blue-300 transition-colors">
                              {article.headline}
                            </h4>
                            <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                              {article.summary}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-blue-400 font-medium bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                {article.source}
                              </span>
                              <span className="text-gray-500 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(article.datetime * 1000).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Trading Modal */}
      {showTradingModal && quote && portfolio && (
        <TradingModal
          stock={{
            ...stock,
            quote,
            profile
          }}
          portfolio={portfolio}
          onClose={() => setShowTradingModal(false)}
          onTransactionComplete={handleTradingComplete}
        />
      )}

      {/* Floating Sparks Animations */}
      <style jsx>{`
        @keyframes spark {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% { 
            transform: translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px) scale(1.2);
            opacity: 0.8;
          }
          50% { 
            transform: translate(${Math.random() * 15 - 7.5}px, ${Math.random() * 15 - 7.5}px) scale(0.8);
            opacity: 0.5;
          }
          75% { 
            transform: translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px) scale(1.1);
            opacity: 0.7;
          }
        }

        @keyframes hex-pulse {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.2) rotate(60deg);
            opacity: 0.6;
          }
        }

        @keyframes pulse-connect {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.4;
          }
        }

        @keyframes float-dust {
          0% { 
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          25% { 
            transform: translateY(-20px) translateX(10px);
            opacity: 0.7;
          }
          50% { 
            transform: translateY(-40px) translateX(-10px);
            opacity: 0.3;
          }
          75% { 
            transform: translateY(-60px) translateX(5px);
            opacity: 0.7;
          }
          100% { 
            transform: translateY(-80px) translateX(0px);
            opacity: 0;
          }
        }

        @keyframes grid-point {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.5);
            opacity: 0.7;
          }
        }

        @keyframes line-pulse {
          0%, 100% { 
            opacity: 0.1;
          }
          50% { 
            opacity: 0.3;
          }
        }

        .animate-spark {
          animation: spark 5s ease-in-out infinite;
        }

        .animate-hex-pulse {
          animation: hex-pulse 8s ease-in-out infinite;
        }

        .animate-float-dust {
          animation: float-dust 20s linear infinite;
        }

        .animate-grid-point {
          animation: grid-point 4s ease-in-out infinite;
        }

        .animate-line-pulse {
          animation: line-pulse 5s ease-in-out infinite;
        }

        .spark, .hexagonal-speck, .dust-particle, .grid-point {
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        .connection-pulse {
          will-change: transform, opacity;
          animation: pulse-connect 3s ease-in-out infinite;
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
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