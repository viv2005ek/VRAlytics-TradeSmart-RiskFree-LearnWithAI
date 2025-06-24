import React from 'react';
import { TrendingUp, Gift } from 'lucide-react';

interface ActionButtonsProps {
  onTrendingStocksClick?: () => void;
  onInviteFriendsClick?: () => void;
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onTrendingStocksClick,
  onInviteFriendsClick,
  className = '' 
}) => {
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {/* Trending Stocks Button */}
      <button
        onClick={onTrendingStocksClick}
        className="flex items-center px-6 py-3 bg-gray-800/80 backdrop-blur-sm border border-purple-500/50 rounded-xl text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 group"
      >
        <TrendingUp className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
        <span className="font-medium">Trending Stocks</span>
      </button>

      {/* Invite Friends Button */}
      <button
        onClick={onInviteFriendsClick}
        className="flex items-center px-6 py-3 bg-gray-800/80 backdrop-blur-sm border border-green-500/50 rounded-xl text-green-400 hover:bg-green-500/10 hover:border-green-400 transition-all duration-300 transform hover:scale-105 group"
      >
        <Gift className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
        <span className="font-medium">Invite Friends (+$1,000)</span>
      </button>
    </div>
  );
};