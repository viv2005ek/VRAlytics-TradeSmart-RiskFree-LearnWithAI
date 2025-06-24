import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Crunching market data...",
  subMessage 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  const stockTips = [
    "Patience beats volatility!",
    "Diversification is key to success",
    "Time in market beats timing the market",
    "Research before you invest",
    "Stay informed, stay profitable"
  ];

  const tickerSymbols = ['AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'JPM', 'V', 'JNJ'];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + Math.random() * 15;
      });
    }, 200);

    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % stockTips.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main Loading Container */}
      <div className="relative z-10 text-center max-w-md w-full mx-4">
        {/* Spinning Bull Logo */}
        <div className="mb-8 flex justify-center">
          <div 
            className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center animate-spin-slow"
            style={{
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)',
              animation: 'spin 2s linear infinite'
            }}
          >
            <BarChart2 className="w-10 h-10 text-purple-400" />
          </div>
        </div>

        {/* 3D Stock Graph */}
        <div className="mb-8 flex justify-center">
          <svg width="200" height="80" viewBox="0 0 200 80" className="opacity-60">
            <defs>
              <linearGradient id="graphGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d="M10,60 Q30,40 50,45 T90,35 T130,25 T170,30 T190,20"
              stroke="#C4B5FD"
              strokeWidth="2"
              fill="none"
              className="animate-draw-path"
            />
            <path
              d="M10,60 Q30,40 50,45 T90,35 T130,25 T170,30 T190,20 L190,70 L10,70 Z"
              fill="url(#graphGradient)"
              className="animate-fill-graph"
            />
          </svg>
        </div>

        {/* Primary Text */}
        <h2 
          className="text-2xl font-bold mb-4 text-white"
          style={{
            fontFamily: '"Orbitron", monospace',
            color: '#E9D5FF',
            textShadow: '0 0 10px rgba(233, 213, 255, 0.3)'
          }}
        >
          {message}
        </h2>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-800/50 rounded-full h-0.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-teal-400 rounded-full transition-all duration-300 ease-out animate-pulse"
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
              }}
            ></div>
          </div>
        </div>

        {/* Stock Tips */}
        <div className="mb-8 h-6">
          <p 
            className="text-purple-300 transition-all duration-500 ease-in-out"
            style={{
              color: '#A78BFA',
              opacity: 1
            }}
            key={currentTip}
          >
            {subMessage || stockTips[currentTip]}
          </p>
        </div>

        {/* Stock Ticker Tape */}
        <div className="overflow-hidden bg-black/20 backdrop-blur-sm rounded-lg border border-purple-500/20">
          <div className="flex animate-scroll-ticker whitespace-nowrap py-2">
            {[...tickerSymbols, ...tickerSymbols].map((symbol, index) => (
              <span
                key={index}
                className="inline-block mx-4 text-purple-400 font-mono text-sm"
                style={{ color: '#A78BFA' }}
              >
                {symbol} {Math.random() > 0.5 ? '↗' : '↘'} ${(Math.random() * 1000 + 100).toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes draw-path {
          0% {
            stroke-dasharray: 0 300;
          }
          100% {
            stroke-dasharray: 300 0;
          }
        }

        @keyframes fill-graph {
          0% {
            opacity: 0;
            transform: scaleY(0);
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.3;
            transform: scaleY(1);
          }
        }

        @keyframes scroll-ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-draw-path {
          animation: draw-path 2.5s ease-in-out infinite;
        }

        .animate-fill-graph {
          animation: fill-graph 2.5s ease-in-out infinite;
          transform-origin: bottom;
        }

        .animate-scroll-ticker {
          animation: scroll-ticker 8s linear infinite;
        }

        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
      `}</style>
    </div>
  );
};