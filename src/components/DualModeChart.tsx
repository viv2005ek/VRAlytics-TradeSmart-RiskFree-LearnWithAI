import React, { useState, useEffect, useRef } from 'react';
import { ToggleLeft, ToggleRight, TrendingUp, TrendingDown, BarChart3, Activity, Zap, Loader2 } from 'lucide-react';
import { PriceChart3D } from './PriceChart3D';
import { TradingViewChart } from './TradingViewChart';

interface DualModeChartProps {
  symbol: string;
  timeframe: '1D' | '1M' | '1Y';
  onTimeframeChange: (timeframe: '1D' | '1M' | '1Y') => void;
  className?: string;
}

export const DualModeChart: React.FC<DualModeChartProps> = ({ 
  symbol, 
  timeframe, 
  onTimeframeChange,
  className = '' 
}) => {
  const [is3DMode, setIs3DMode] = useState(true); // Default to 3D mode
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showSMA, setShowSMA] = useState(false);

  const handleModeToggle = () => {
    setIsTransitioning(true);
    
    // Cross-fade transition
    setTimeout(() => {
      setIs3DMode(!is3DMode);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 300);
  };

  return (
    <div className={`relative backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl overflow-hidden hover:bg-black/15 transition-all duration-300 ${className}`}
         style={{
           boxShadow: `
             0 8px 32px 0 rgba(0, 0, 0, 0.4),
             inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
             0 0 0 1px rgba(255, 255, 255, 0.05)
           `
         }}>
      {/* Controls Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
          Price Chart
        </h3>
        
        <div className="flex items-center space-x-4">
          {/* Timeframe Controls - Always Visible */}
          <div className="flex space-x-2">
            {(['1D', '1M', '1Y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => onTimeframeChange(period)}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 border ${
                  timeframe === period
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-black/20 border-white/20 text-gray-300 hover:bg-black/30 hover:border-white/30'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Indicator Controls - Always Visible */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 border ${
                showRSI
                  ? 'bg-purple-500/20 border-purple-400/50 text-purple-400 shadow-lg shadow-purple-500/20'
                  : 'bg-black/20 border-white/20 text-gray-300 hover:bg-black/30 hover:border-white/30'
              }`}
            >
              <Activity className="w-4 h-4 mr-1" />
              RSI
            </button>
            
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 border ${
                showSMA
                  ? 'bg-green-500/20 border-green-400/50 text-green-400 shadow-lg shadow-green-500/20'
                  : 'bg-black/20 border-white/20 text-gray-300 hover:bg-black/30 hover:border-white/30'
              }`}
            >
              <Zap className="w-4 h-4 mr-1" />
              SMA
            </button>
          </div>

          {/* Mode Toggle Button */}
          <button
            onClick={handleModeToggle}
            disabled={isTransitioning}
            className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-500 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border ${
              is3DMode
                ? 'bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20 border-purple-400/50 text-purple-400 shadow-lg shadow-purple-500/20'
                : 'bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-teal-600/20 border-blue-400/50 text-blue-400 shadow-lg shadow-blue-500/20'
            }`}
            style={{
              animation: isTransitioning ? 'none' : 'neonGlow 3s ease-in-out infinite'
            }}
          >
            {is3DMode ? (
              <>
                <ToggleRight className="w-5 h-5 mr-2" />
                3D Mode
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 mr-2" />
                2D Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chart Container with Cross-fade Transition */}
      <div className="relative h-[calc(100%-64px)] bg-black/5">
        {/* Transition Overlay */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
              <p className="text-cyan-300 text-sm">
                Switching to {is3DMode ? '2D' : '3D'} mode...
              </p>
            </div>
          </div>
        )}

        {/* 2D TradingView Chart */}
        <div 
          className={`absolute inset-0 transition-all duration-600 ${
            is3DMode 
              ? 'opacity-0 scale-95 pointer-events-none' 
              : 'opacity-100 scale-100'
          }`}
        >
          <TradingViewChart
            symbol={symbol}
            timeframe={timeframe}
            showRSI={showRSI}
            showSMA={showSMA}
            className="h-full"
          />
        </div>

        {/* 3D Three.js Chart */}
        <div 
          className={`absolute inset-0 transition-all duration-600 ${
            !is3DMode 
              ? 'opacity-0 scale-95 pointer-events-none' 
              : 'opacity-100 scale-100'
          }`}
        >
          <PriceChart3D
            symbol={symbol}
            timeframe={timeframe}
            showRSI={showRSI}
            showSMA={showSMA}
            className="h-full"
          />
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className={`px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-sm border ${
          is3DMode
            ? 'bg-purple-600/20 border-purple-400/30 text-purple-100'
            : 'bg-blue-600/20 border-blue-400/30 text-blue-100'
        }`}>
          {is3DMode ? '3D Holographic' : '2D Professional'}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes neonGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
          }
        }
        
        @keyframes liquidFill {
          0% {
            background: linear-gradient(45deg, transparent 0%, rgba(6, 182, 212, 0.3) 50%, transparent 100%);
            background-size: 200% 200%;
            background-position: -100% 0;
          }
          100% {
            background: linear-gradient(45deg, transparent 0%, rgba(6, 182, 212, 0.3) 50%, transparent 100%);
            background-size: 200% 200%;
            background-position: 100% 0;
          }
        }
      `}</style>
    </div>
  );
};