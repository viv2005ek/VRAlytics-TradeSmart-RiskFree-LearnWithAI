import React, { useState, useEffect, useRef } from 'react';
import { Home, TrendingUp, User, Menu, X, LogOut, DollarSign, Search, Eye, Activity, Sparkles, Zap, Star, Hexagon, Users, BarChart2, Bot } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { UserPortfolio } from '../lib/database';

interface NavBarProps {
  currentPage?: 'dashboard' | 'stocks' | 'about' | 'profile' | 'ai';
  onNavigate?: (page: 'dashboard' | 'stocks' | 'about' | 'profile' | 'ai') => void;
  portfolio?: UserPortfolio | null;
  className?: string;
}

export const NavBar: React.FC<NavBarProps> = ({ 
  currentPage = 'dashboard', 
  onNavigate,
  portfolio,
  className = '' 
}) => {
  const { signOut } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Auto-hide functionality with improved scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      lastActivityRef.current = Date.now();
      
      // Always show navbar when at the top of the page
      if (currentScrollY <= 10) {
        setIsVisible(true);
        // Clear any existing timeout when at top
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        setLastScrollY(currentScrollY);
        return;
      }
      
      // Show navbar on scroll up
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
      
      // Clear existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      // Only set timeout to hide if not at top of page
      if (currentScrollY > 10) {
        hideTimeoutRef.current = setTimeout(() => {
          if (Date.now() - lastActivityRef.current >= 5000 && window.scrollY > 10) {
            setIsVisible(false);
          }
        }, 5000);
      }
    };

    const handleMouseMove = () => {
      lastActivityRef.current = Date.now();
      setIsVisible(true);
      
      // Clear existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      // Only set timeout to hide if not at top of page
      if (window.scrollY > 10) {
        hideTimeoutRef.current = setTimeout(() => {
          if (Date.now() - lastActivityRef.current >= 5000 && window.scrollY > 10) {
            setIsVisible(false);
          }
        }, 5000);
      }
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Initial timeout only if not at top
    if (window.scrollY > 10) {
      hideTimeoutRef.current = setTimeout(() => {
        if (Date.now() - lastActivityRef.current >= 5000 && window.scrollY > 10) {
          setIsVisible(false);
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [lastScrollY]);

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: Home,
      href: '#dashboard'
    },
    {
      id: 'stocks' as const,
      label: 'Stocks',
      icon: TrendingUp,
      href: '#stocks'
    },
    {
      id: 'ai' as const,
      label: 'Ask AI',
      icon: Bot,
      href: '#ai'
    },
    {
      id: 'about' as const,
      label: 'About Us',
      icon: Users,
      href: '#about'
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      href: '#profile'
    }
  ];

  const handleNavClick = (page: 'dashboard' | 'stocks' | 'about' | 'profile' | 'ai') => {
    if (onNavigate) {
      onNavigate(page);
    }
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          isVisible 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform -translate-y-full opacity-0'
        } ${className}`}
      >
        <div className="bg-black/60 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo/Brand */}
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-lg flex items-center justify-center mr-2 border border-blue-400/30 shadow-lg shadow-blue-500/20">
                    <BarChart2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <h1 
                    className="text-xl font-bold"
                    style={{
                      fontFamily: 'Orbitron, monospace',
                      background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #d946ef)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    VRAlytics
                  </h1>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`group flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                          isActive
                            ? 'bg-black/40 border border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                            : 'text-gray-300 hover:text-white hover:bg-black/30 border border-transparent hover:border-white/20'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mr-2 transition-transform duration-300 ${
                          isActive ? 'scale-110' : 'group-hover:scale-110'
                        }`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-300"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ease-out ${
        isMobileMenuOpen ? 'visible' : 'invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div className={`absolute top-0 right-0 h-full w-64 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 shadow-2xl transform transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold text-white">Navigation</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Navigation Items */}
            <div className="flex-1 px-4 py-6">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-black/40 border border-blue-500/50 text-blue-400 shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-black/30 border border-transparent hover:border-white/20'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${
                        isActive ? 'scale-110' : ''
                      }`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16" />
    </>
  );
};