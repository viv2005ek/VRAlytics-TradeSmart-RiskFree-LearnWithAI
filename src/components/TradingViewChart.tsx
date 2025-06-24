import React from 'react';
import { PriceChart } from './PriceChart';

interface TradingViewChartProps {
  symbol: string;
  timeframe: '1D' | '1M' | '1Y';
  showRSI?: boolean;
  showSMA?: boolean;
  className?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = (props) => {
  // Simply use the Chart.js implementation
  return <PriceChart {...props} />;
};