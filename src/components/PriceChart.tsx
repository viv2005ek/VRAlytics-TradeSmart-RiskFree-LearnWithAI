import React, { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Loader2, TrendingUp, TrendingDown, BarChart3, Activity, Zap } from 'lucide-react';
import { yahooFinanceAPI, YahooStockHistory } from '../lib/yahooFinance';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  symbol: string;
  timeframe: '1D' | '1M' | '1Y';
  showRSI?: boolean;
  showSMA?: boolean;
  className?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ 
  symbol, 
  timeframe, 
  showRSI = false, 
  showSMA = false,
  className = '' 
}) => {
  const [chartData, setChartData] = useState<YahooStockHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadChartData();
  }, [symbol, timeframe]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const intervalMap = {
        '1D': { interval: '5m' as const, limit: 78 },
        '1M': { interval: '1d' as const, limit: 30 },
        '1Y': { interval: '1wk' as const, limit: 52 }
      };
      
      const { interval, limit } = intervalMap[timeframe];
      const data = await yahooFinanceAPI.getStockHistory(symbol, interval, limit);
      
      setChartData(data);
    } catch (err) {
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSMA = (data: number[], period: number = 20): (number | null)[] => {
    const sma: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  const calculateRSI = (data: number[], period: number =  14): (number | null)[] => {
    const rsi: (number | null)[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // First calculate price changes
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate RSI for each point
    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        // Not enough data for the period yet
        rsi.push(null);
      } else {
        // Calculate average gain and average loss
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        
        // Calculate RS and RSI
        if (avgLoss === 0) {
          // If there are no losses, RSI is 100
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }

    // Add null for the first point to align with price data
    return [null, ...rsi];
  };

  const formatTimeLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeframe === '1D') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  const getChangeInfo = () => {
    if (!chartData || chartData.data.length < 2) return null;
    
    const firstPrice = chartData.data[0].close;
    const lastPrice = chartData.data[chartData.data.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    
    return {
      change,
      changePercent,
      isPositive: change >= 0
    };
  };

  const changeInfo = getChangeInfo();

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl p-6 hover:bg-black/15 transition-all duration-300 h-full flex items-center justify-center"
           style={{
             boxShadow: `
               0 8px 32px 0 rgba(0, 0, 0, 0.4),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
               0 0 0 1px rgba(255, 255, 255, 0.05)
             `
           }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading price chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl p-6 hover:bg-black/15 transition-all duration-300 h-full flex items-center justify-center"
           style={{
             boxShadow: `
               0 8px 32px 0 rgba(0, 0, 0, 0.4),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
               0 0 0 1px rgba(255, 255, 255, 0.05)
             `
           }}>
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadChartData}
            className="border border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.data.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl p-6 hover:bg-black/15 transition-all duration-300 h-full flex items-center justify-center"
           style={{
             boxShadow: `
               0 8px 32px 0 rgba(0, 0, 0, 0.4),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
               0 0 0 1px rgba(255, 255, 255, 0.05)
             `
           }}>
        <p className="text-gray-400">No chart data available for this timeframe</p>
      </div>
    );
  }

  const prices = chartData.data.map(d => d.close);
  const volumes = chartData.data.map(d => d.volume);
  const labels = chartData.data.map(d => formatTimeLabel(d.timestamp));
  const smaData = showSMA ? calculateSMA(prices, 20) : [];
  const rsiData = showRSI ? calculateRSI(prices, 14) : [];

  // Calculate dynamic height based on indicators
  const baseHeight = 300;
  const volumeHeight = 80;
  const rsiHeight = showRSI ? 100 : 0;
  const totalHeight = baseHeight + volumeHeight + rsiHeight;

  // Main price chart data
  const priceChartData = {
    labels,
    datasets: [
      {
        label: 'Price',
        data: prices,
        borderColor: changeInfo?.isPositive ? '#00d4ff' : '#ff5e3a',
        backgroundColor: changeInfo?.isPositive 
          ? 'rgba(0, 212, 255, 0.1)' 
          : 'rgba(255, 94, 58, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: changeInfo?.isPositive ? '#00d4ff' : '#ff5e3a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      ...(showSMA ? [{
        label: 'SMA(20)',
        data: smaData,
        borderColor: '#fbbf24',
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderDash: [5, 5],
      }] : []),
    ],
  };

  // Volume chart data
  const volumeChartData = {
    labels,
    datasets: [
      {
        label: 'Volume',
        data: volumes,
        backgroundColor: chartData.data.map((item, index) => 
          item.close >= item.open 
            ? 'rgba(0, 212, 255, 0.6)' 
            : 'rgba(255, 94, 58, 0.6)'
        ),
        borderColor: chartData.data.map((item, index) => 
          item.close >= item.open 
            ? '#00d4ff' 
            : '#ff5e3a'
        ),
        borderWidth: 1,
      },
    ],
  };

  // RSI chart data
  const rsiChartData = {
    labels,
    datasets: [
      {
        label: 'RSI(14)',
        data: rsiData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#d1d5db',
          font: {
            family: 'Inter, sans-serif',
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'line',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(0, 212, 255, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context: any) {
            return labels[context[0].dataIndex];
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            if (label === 'Price' || label === 'SMA(20)') {
              return `${label}: $${context.parsed.y.toFixed(2)}`;
            } else if (label === 'Volume') {
              return `${label}: ${context.parsed.y.toLocaleString()}`;
            } else if (label === 'RSI(14)') {
              return `${label}: ${context.parsed.y.toFixed(2)}`;
            }
            return `${label}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'Inter, sans-serif',
            size: 11,
          },
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'Inter, sans-serif',
            size: 11,
          },
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          },
        },
      },
    },
  };

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(0, 212, 255, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: function(context: any) {
            return labels[context[0].dataIndex];
          },
          label: function(context: any) {
            return `Volume: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'Inter, sans-serif',
            size: 10,
          },
          callback: function(value: any) {
            if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
            if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
            if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
            return value.toString();
          },
        },
      },
    },
  };

  const rsiOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: function(context: any) {
            return labels[context[0].dataIndex];
          },
          label: function(context: any) {
            return `RSI: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'Inter, sans-serif',
            size: 10,
          },
          stepSize: 25,
        },
      },
    },
  };

  return (
    <div 
      className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl overflow-hidden hover:bg-black/15 transition-all duration-300"
      style={{
        height: `${totalHeight + 100}px`, // Add padding for container
        boxShadow: `
          0 8px 32px 0 rgba(0, 0, 0, 0.4),
          inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
          0 0 0 1px rgba(255, 255, 255, 0.05)
        `
      }}
    >
      {/* Charts Container */}
      <div className="p-4 space-y-4 h-full flex flex-col">
        {/* Main Price Chart */}
        <div style={{ height: `${baseHeight}px` }}>
          <Line data={priceChartData} options={chartOptions} />
        </div>

        {/* Volume Chart */}
        <div style={{ height: `${volumeHeight}px` }}>
          <Bar data={volumeChartData} options={volumeOptions} />
        </div>

        {/* RSI Chart */}
        {showRSI && (
          <div style={{ height: `${rsiHeight}px` }}>
            <Line data={rsiChartData} options={rsiOptions} />
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-black/20">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Chart.js Professional Charts • {timeframe} timeframe</span>
          <div className="flex items-center space-x-4">
            {showSMA && (
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-yellow-400 mr-1"></div>
                <span>SMA(20)</span>
              </div>
            )}
            {showRSI && (
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-purple-400 mr-1"></div>
                <span>RSI(14)</span>
              </div>
            )}
            <span>{chartData?.data.length || 0} data points</span>
          </div>
        </div>
      </div>
    </div>
  );
};