import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { databaseService, NetWorthHistory } from '../lib/database';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface NetWorthChartProps {
  userId: string;
  className?: string;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ userId, className = '' }) => {
  const [netWorthData, setNetWorthData] = useState<NetWorthHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [expandedMetrics, setExpandedMetrics] = useState(false);

  useEffect(() => {
    if (userId) {
      loadNetWorthData();
    }
  }, [userId, timeframe]);

  const loadNetWorthData = async () => {
    try {
      setLoading(true);
      console.log(`📊 Loading net worth chart data for timeframe: ${timeframe}`);
      
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const data = await databaseService.getNetWorthHistory(userId, days);
      
      console.log(`📈 Received ${data.length} net worth data points for chart`);
      
      // If no data exists, create initial entry with current date
      if (data.length === 0) {
        console.log('📊 No net worth data found, creating initial entry...');
        await databaseService.addNetWorthHistory(userId, 5000, 5000, 0);
        const newData = await databaseService.getNetWorthHistory(userId, days);
        setNetWorthData(newData);
        console.log(`📈 Created initial data, now have ${newData.length} entries`);
      } else {
        setNetWorthData(data);
        console.log('📊 Net worth chart data loaded successfully');
        
        // Verify data integrity - check for historical data protection
        const today = new Date().toISOString().split('T')[0];
        const todayEntry = data.find(item => item.date === today);
        const historicalEntries = data.filter(item => item.date !== today);
        
        console.log('🔒 Data integrity check:', {
          totalEntries: data.length,
          todayEntry: todayEntry ? 'Found' : 'Not found',
          historicalEntries: historicalEntries.length,
          dateRange: data.length > 0 ? `${data[0].date} to ${data[data.length - 1].date}` : 'No data'
        });
      }
    } catch (error) {
      console.error('❌ Error loading net worth data for chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: netWorthData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Net Worth',
        data: netWorthData.map(item => item.net_worth),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'rgb(59, 130, 246)',
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: 'rgb(255, 255, 255)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const dataPoint = netWorthData[context.dataIndex];
            return [
              `Net Worth: $${context.parsed.y.toLocaleString()}`,
              `V-Cash: $${dataPoint.v_cash.toLocaleString()}`,
              `Portfolio: $${dataPoint.portfolio_value.toLocaleString()}`
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (loading) {
    return (
      <div className={`backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-6 ${className}`}
           style={{
             boxShadow: `
               0 8px 32px 0 rgba(0, 0, 0, 0.6),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
               0 0 0 1px rgba(255, 255, 255, 0.02)
             `
           }}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-6 ${className}`}
         style={{
           boxShadow: `
             0 8px 32px 0 rgba(0, 0, 0, 0.6),
             inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
             0 0 0 1px rgba(255, 255, 255, 0.02)
           `
         }}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Net Worth Growth</h3>
        <p className="text-gray-400 text-sm">Real-time tracking with interactive metrics</p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                timeframe === period
                  ? 'bg-blue-600/80 backdrop-blur-sm text-white shadow-lg shadow-blue-500/30 border border-blue-400/50'
                  : 'bg-black/30 backdrop-blur-sm text-gray-300 hover:bg-black/50 border border-white/20'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-64 mb-6">
        {netWorthData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No data available yet. Start trading to see your growth!</p>
          </div>
        )}
      </div>
      
      {/* Enhanced Data Summary with Interactive Dropdown */}
      {netWorthData.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => setExpandedMetrics(!expandedMetrics)}
            className="w-full flex items-center justify-between text-left mb-4 hover:bg-white/5 rounded-lg p-3 transition-colors"
          >
            <span className="text-white font-medium">Current Metrics</span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${expandedMetrics ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div className={`transition-all duration-300 overflow-hidden ${expandedMetrics ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 hover:bg-black/40 transition-colors border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Current Net Worth</p>
                <p className="text-lg font-bold text-white">
                  ${netWorthData[netWorthData.length - 1]?.net_worth.toLocaleString()}
                </p>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 hover:bg-black/40 transition-colors border border-white/10">
                <p className="text-xs text-gray-400 mb-1">V-Cash</p>
                <p className="text-lg font-bold text-blue-400">
                  ${netWorthData[netWorthData.length - 1]?.v_cash.toLocaleString()}
                </p>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 hover:bg-black/40 transition-colors border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Portfolio Value</p>
                <p className="text-lg font-bold text-purple-400">
                  ${netWorthData[netWorthData.length - 1]?.portfolio_value.toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Growth Metrics */}
            {netWorthData.length > 1 && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 hover:bg-black/40 transition-colors border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Period Growth</p>
                  <p className={`text-lg font-bold ${
                    netWorthData[netWorthData.length - 1]?.net_worth >= netWorthData[0]?.net_worth 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {((netWorthData[netWorthData.length - 1]?.net_worth - netWorthData[0]?.net_worth) / netWorthData[0]?.net_worth * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 hover:bg-black/40 transition-colors border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Data Points</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {netWorthData.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};