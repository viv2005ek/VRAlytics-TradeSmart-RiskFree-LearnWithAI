import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Gift, User, LogOut, DollarSign, Search, Eye, Activity, Sparkles, Zap, Star, Hexagon } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { UserPortfolio, databaseService } from '../lib/database';
import { StockMarket } from './StockMarket';
import { StockSearch } from './StockSearch';
import { TradingModal } from './TradingModal';
import { StockDetail } from './StockDetail';
import { ProfilePage } from './ProfilePage';
import { AboutUs } from './AboutUs';
import { NavBar } from './NavBar';
import { DashboardMetrics } from './DashboardMetrics';
import { SearchStocksBar } from './SearchStocksBar';
import { ActionButtons } from './ActionButtons';
import { NetWorthChart } from './NetWorthChart';
import { PortfolioHoldings } from './PortfolioHoldings';
import { Watchlist } from './Watchlist';
import { RecentActivity } from './RecentActivity';
import { InviteFriendsModal } from './InviteFriendsModal';
import { LoadingScreen } from './LoadingScreen';
import { AskAI } from './AskAI';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'stocks' | 'about' | 'profile' | 'ai'>('dashboard');
  const [showStockMarket, setShowStockMarket] = useState(false);
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [showStockDetail, setShowStockDetail] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showAskAI, setShowAskAI] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [detailStock, setDetailStock] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hideNavbar, setHideNavbar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Hide navbar when modals are open
  useEffect(() => {
    setHideNavbar(showInviteModal);
  }, [showInviteModal]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get or create user portfolio
      let userPortfolio = await databaseService.getUserPortfolio(user.id);
      
      if (!userPortfolio) {
        userPortfolio = await databaseService.createUserPortfolio(user.id);
      }
      
      setPortfolio(userPortfolio);

      // Update net worth history for today
      if (userPortfolio) {
        const userStocks = await databaseService.getUserStocks(user.id);
        let portfolioValue = 0;
        
        // Calculate portfolio value (simplified - in real app would get current prices)
        for (const stock of userStocks) {
          portfolioValue += stock.avg_buy_price * stock.quantity;
        }
        
        const netWorth = userPortfolio.v_cash_balance + portfolioValue;
        
        await databaseService.addNetWorthHistory(
          user.id,
          netWorth,
          userPortfolio.v_cash_balance,
          portfolioValue
        );
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (page: 'dashboard' | 'stocks' | 'about' | 'profile' | 'ai') => {
    setCurrentPage(page);
    
    // Handle specific navigation logic
    if (page === 'stocks') {
      setShowStockMarket(true);
      setShowProfilePage(false);
      setShowAboutUs(false);
      setShowAskAI(false);
    } else if (page === 'profile') {
      setShowProfilePage(true);
      setShowStockMarket(false);
      setShowAboutUs(false);
      setShowAskAI(false);
    } else if (page === 'about') {
      setShowAboutUs(true);
      setShowStockMarket(false);
      setShowProfilePage(false);
      setShowAskAI(false);
    } else if (page === 'ai') {
      setShowAskAI(true);
      setShowAboutUs(false);
      setShowStockMarket(false);
      setShowProfilePage(false);
    } else {
      // Dashboard - reset to main view
      setShowStockMarket(false);
      setShowProfilePage(false);
      setShowAboutUs(false);
      setShowAskAI(false);
    }
  };

  const handleStockSelect = (stock: any) => {
    setDetailStock(stock);
    setShowStockSearch(false);
    setShowStockDetail(true);
  };

  const handleTransactionComplete = () => {
    setShowTradingModal(false);
    setSelectedStock(null);
    loadUserData(); // Refresh data after transaction
  };

  const handleTrendingStocksClick = () => {
    setCurrentPage('stocks');
    setShowStockMarket(true);
    setShowProfilePage(false);
    setShowAboutUs(false);
    setShowAskAI(false);
  };

  const handleInviteFriendsClick = () => {
    setShowInviteModal(true);
  };

  const handleStockClick = (stock: any) => {
    setDetailStock(stock);
    setShowStockDetail(true);
  };

  const handleWatchlistStockClick = (symbol: string) => {
    // Create a basic stock object for the symbol
    const stock = {
      symbol: symbol,
      description: `${symbol} Stock`,
      currency: 'USD',
      displaySymbol: symbol,
      type: 'Common Stock'
    };
    setDetailStock(stock);
    setShowStockDetail(true);
  };

  const handleBackFromStocks = () => {
    setShowStockMarket(false);
    setCurrentPage('dashboard');
  };

  const handleBackFromProfile = () => {
    setShowProfilePage(false);
    setCurrentPage('dashboard');
  };

  const handleBackFromAbout = () => {
    setShowAboutUs(false);
    setCurrentPage('dashboard');
  };

  const handleBackFromAskAI = () => {
    setShowAskAI(false);
    setCurrentPage('dashboard');
  };

  const handleBackFromStockDetail = () => {
    setShowStockDetail(false);
    setDetailStock(null);
  };

  if (loading) {
    return <LoadingScreen message="Loading your portfolio..." />;
  }

  if (showAskAI) {
    return (
      <AskAI
        onBack={handleBackFromAskAI}
        portfolio={portfolio}
      />
    );
  }

  if (showAboutUs) {
    return (
      <AboutUs
        onBack={handleBackFromAbout}
        portfolio={portfolio}
      />
    );
  }

  if (showProfilePage) {
    return (
      <ProfilePage
        onBack={handleBackFromProfile}
        portfolio={portfolio}
      />
    );
  }

  if (showStockDetail && detailStock) {
    return (
      <StockDetail
        stock={detailStock}
        onBack={handleBackFromStockDetail}
        portfolio={portfolio}
        onTransactionComplete={handleTransactionComplete}
      />
    );
  }

  if (showStockMarket) {
    return (
      <StockMarket
        onBack={handleBackFromStocks}
        portfolio={portfolio}
        onTransactionComplete={handleTransactionComplete}
      />
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
      {/* NavBar Component - Hide when modals are open */}
      {!hideNavbar && (
        <NavBar 
          currentPage={currentPage}
          onNavigate={handleNavigation}
          portfolio={portfolio}
        />
      )}

      {/* Minimal Dark Theme Background with Fewer Shining Objects - Fixed Attachment */}
      <div 
        className="fixed inset-0 overflow-hidden"
        style={{
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Reduced Shining Stars - Only 15 instead of 50 */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          >
            <div 
              className="shining-star"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                background: `rgba(${Math.random() > 0.5 ? '255, 255, 255' : '59, 130, 246'}, ${0.6 + Math.random() * 0.4})`,
                borderRadius: '50%',
                boxShadow: `
                  0 0 ${4 + Math.random() * 8}px rgba(${Math.random() > 0.5 ? '255, 255, 255' : '59, 130, 246'}, 0.8),
                  0 0 ${8 + Math.random() * 12}px rgba(${Math.random() > 0.5 ? '255, 255, 255' : '59, 130, 246'}, 0.4)
                `,
              }}
            />
          </div>
        ))}

        {/* Reduced Floating Glowing Orbs - Only 8 instead of 20 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute animate-float-gentle"
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 80 + 10}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
            }}
          >
            <div 
              className="glowing-orb"
              style={{
                width: `${8 + Math.random() * 16}px`,
                height: `${8 + Math.random() * 16}px`,
                background: `radial-gradient(circle, 
                  rgba(${i % 3 === 0 ? '59, 130, 246' : i % 3 === 1 ? '147, 51, 234' : '6, 182, 212'}, 0.8) 0%, 
                  rgba(${i % 3 === 0 ? '59, 130, 246' : i % 3 === 1 ? '147, 51, 234' : '6, 182, 212'}, 0.3) 50%,
                  transparent 100%)`,
                borderRadius: '50%',
                filter: `blur(${1 + Math.random() * 2}px)`,
                boxShadow: `
                  0 0 ${12 + Math.random() * 16}px rgba(${i % 3 === 0 ? '59, 130, 246' : i % 3 === 1 ? '147, 51, 234' : '6, 182, 212'}, 0.6),
                  0 0 ${20 + Math.random() * 24}px rgba(${i % 3 === 0 ? '59, 130, 246' : i % 3 === 1 ? '147, 51, 234' : '6, 182, 212'}, 0.3)
                `,
                animation: `orb-pulse ${3 + Math.random() * 4}s ease-in-out infinite`,
              }}
            />
          </div>
        ))}

        {/* Reduced Shining Diamonds - Only 6 instead of 15 */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`diamond-${i}`}
            className="absolute animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            <div 
              className="shining-diamond"
              style={{
                width: `${5 + Math.random() * 8}px`,
                height: `${5 + Math.random() * 8}px`,
                background: `linear-gradient(45deg, 
                  rgba(255, 255, 255, 0.9) 0%, 
                  rgba(59, 130, 246, 0.7) 50%, 
                  rgba(255, 255, 255, 0.9) 100%)`,
                clipPath: 'polygon(50% 0%, 0% 50%, 50% 100%, 100% 50%)',
                filter: `blur(0.5px)`,
                boxShadow: `
                  0 0 ${8 + Math.random() * 12}px rgba(255, 255, 255, 0.8),
                  0 0 ${16 + Math.random() * 20}px rgba(59, 130, 246, 0.5)
                `,
                animation: `diamond-shine ${2 + Math.random() * 3}s ease-in-out infinite`,
              }}
            />
          </div>
        ))}

        {/* Reduced Floating Particles - Only 12 instead of 30 */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute animate-drift"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          >
            <div 
              className="floating-particle"
              style={{
                width: `${1 + Math.random() * 3}px`,
                height: `${1 + Math.random() * 3}px`,
                background: `rgba(${Math.random() > 0.7 ? '255, 255, 255' : '59, 130, 246'}, ${0.4 + Math.random() * 0.4})`,
                borderRadius: '50%',
                boxShadow: `0 0 ${2 + Math.random() * 4}px rgba(${Math.random() > 0.7 ? '255, 255, 255' : '59, 130, 246'}, 0.6)`,
              }}
            />
          </div>
        ))}

        {/* Subtle Ambient Glow - Reduced opacity for cleaner look */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 25% 25%, rgba(59, 130, 246, 0.01) 0%, transparent 50%),
              radial-gradient(ellipse at 75% 75%, rgba(147, 51, 234, 0.01) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.005) 0%, transparent 60%)
            `,
            animation: 'ambient-pulse 25s ease-in-out infinite'
          }}
        />
      </div>

      {/* Main Content */}
      <main className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${!hideNavbar ? 'pt-24' : 'pt-8'}`}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'Trader'}!
          </h1>
          <p className="text-gray-300 text-lg">
            Here's your portfolio performance overview with real-time net worth tracking.
          </p>
        </div>

        {/* Search Stocks Component */}
        <SearchStocksBar 
          onStockSelect={handleStockSelect}
          className="mb-8"
        />

        {/* Dashboard Metrics Component */}
        <DashboardMetrics 
          userId={user?.id || ''}
          portfolio={portfolio}
          className="mb-8"
        />

        {/* Net Worth Chart Component */}
        <NetWorthChart 
          userId={user?.id || ''}
          className="mb-8"
        />

        {/* Action Buttons Component */}
        <ActionButtons 
          onTrendingStocksClick={handleTrendingStocksClick}
          onInviteFriendsClick={handleInviteFriendsClick}
          className="mb-8"
        />

        {/* Portfolio and Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Portfolio Holdings Component */}
          <PortfolioHoldings 
            userId={user?.id || ''}
            onStockClick={handleStockClick}
            className="h-96"
          />

          {/* Watchlist Component */}
          <Watchlist 
            userId={user?.id || ''}
            onStockClick={handleWatchlistStockClick}
            className="h-96"
          />
        </div>

        {/* Recent Activity Component */}
        <RecentActivity 
          userId={user?.id || ''}
          className="mb-8"
        />
      </main>

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
      )}

      {/* Stock Search Modal */}
      {showStockSearch && (
        <StockSearch
          onStockSelect={handleStockSelect}
          onClose={() => setShowStockSearch(false)}
        />
      )}

      {/* Trading Modal */}
      {showTradingModal && selectedStock && portfolio && (
        <TradingModal
          stock={selectedStock}
          portfolio={portfolio}
          onClose={() => setShowTradingModal(false)}
          onTransactionComplete={handleTransactionComplete}
        />
      )}

      {/* Optimized Dark Theme Shining Animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.5);
          }
        }

        @keyframes sparkle {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1) rotate(0deg);
          }
          25% { 
            opacity: 0.8; 
            transform: scale(1.3) rotate(90deg);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.6) rotate(180deg);
          }
          75% { 
            opacity: 0.8; 
            transform: scale(1.3) rotate(270deg);
          }
        }

        @keyframes float-gentle {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
          }
          25% { 
            transform: translateY(-15px) translateX(10px); 
          }
          50% { 
            transform: translateY(-25px) translateX(-5px); 
          }
          75% { 
            transform: translateY(-10px) translateX(-15px); 
          }
        }

        @keyframes drift {
          0% { 
            transform: translateY(100vh) translateX(0px) rotate(0deg); 
            opacity: 0; 
          }
          10% { 
            opacity: 1; 
          }
          90% { 
            opacity: 1; 
          }
          100% { 
            transform: translateY(-100vh) translateX(50px) rotate(360deg); 
            opacity: 0; 
          }
        }

        @keyframes orb-pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.4); 
            opacity: 1;
          }
        }

        @keyframes diamond-shine {
          0%, 100% { 
            opacity: 0.5; 
            transform: scale(1) rotate(0deg);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2) rotate(45deg);
          }
        }

        @keyframes ambient-pulse {
          0%, 100% { 
            opacity: 0.2; 
          }
          50% { 
            opacity: 0.4; 
          }
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 4s ease-in-out infinite;
        }

        .animate-float-gentle {
          animation: float-gentle 8s ease-in-out infinite;
        }

        .animate-drift {
          animation: drift 20s linear infinite;
        }

        .shining-star,
        .glowing-orb,
        .shining-diamond,
        .floating-particle {
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        /* Ensure fixed background attachment works properly */
        body {
          background-attachment: fixed;
        }
      `}</style>
    </div>
  );
};