import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, DollarSign, Gift, Loader2, ArrowUpDown, Filter, X } from 'lucide-react';
import { Transaction, databaseService } from '../lib/database';

interface RecentActivityProps {
  userId: string;
  onTransactionClick?: (transaction: Transaction) => void;
  className?: string;
}

type FilterType = 'all' | 'buy' | 'sell' | 'referral';

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  userId, 
  onTransactionClick,
  className = '' 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (userId) {
      loadTransactions();
    }
  }, [userId]);

  useEffect(() => {
    applyFilter();
  }, [transactions, activeFilter, sortOrder]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const userTransactions = await databaseService.getUserTransactions(userId, 50);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = transactions;

    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = transactions.filter(t => t.type === activeFilter);
    }

    // Apply sort order
    filtered = [...filtered].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });

    setFilteredTransactions(filtered);
  };

  const handleSwap = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setShowFilters(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'sell':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'referral':
        return <Gift className="w-5 h-5 text-purple-400" />;
      default:
        return <DollarSign className="w-5 h-5 text-blue-400" />;
    }
  };

  const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-400';
    if (amount < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getFilterColor = (filter: FilterType) => {
    switch (filter) {
      case 'buy':
        return 'text-green-400 border-green-400/50 bg-green-500/10';
      case 'sell':
        return 'text-red-400 border-red-400/50 bg-red-500/10';
      case 'referral':
        return 'text-purple-400 border-purple-400/50 bg-purple-500/10';
      default:
        return 'text-blue-400 border-blue-400/50 bg-blue-500/10';
    }
  };

  if (loading) {
    return (
      <div className={`backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl flex flex-col h-96 ${className}`}
           style={{
             boxShadow: `
               0 8px 32px 0 rgba(0, 0, 0, 0.6),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
               0 0 0 1px rgba(255, 255, 255, 0.02)
             `
           }}>
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
            <span className="text-gray-300">Loading activity...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl flex flex-col h-96 ${className}`}
         style={{
           boxShadow: `
             0 8px 32px 0 rgba(0, 0, 0, 0.6),
             inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
             0 0 0 1px rgba(255, 255, 255, 0.02)
           `
         }}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          <div className="flex items-center space-x-2">
            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors group"
              >
                <Filter className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
                Filter
              </button>
              
              {/* Filter Dropdown */}
              {showFilters && (
                <div className="absolute top-full right-0 mt-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-10 min-w-[120px]">
                  <div className="p-2">
                    {(['all', 'buy', 'sell', 'referral'] as FilterType[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => handleFilterChange(filter)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                          activeFilter === filter 
                            ? getFilterColor(filter)
                            : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              className="flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors group"
              title={`Sort by date ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ArrowUpDown className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
              Swap
            </button>
          </div>
        </div>

        {/* Active Filter Indicator */}
        {activeFilter !== 'all' && (
          <div className="mt-3 flex items-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getFilterColor(activeFilter)}`}>
              {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Transactions
              <button
                onClick={() => setActiveFilter('all')}
                className="ml-2 hover:scale-110 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Activity List with Fixed Height and Scrollbar */}
      <div className="flex-1 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-6 text-center">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              {activeFilter === 'all' ? 'No recent activity' : `No ${activeFilter} transactions`}
            </p>
            <p className="text-gray-500 text-sm">
              {activeFilter === 'all' 
                ? 'Your trading activity will appear here' 
                : `Try a different filter or start ${activeFilter === 'referral' ? 'referring friends' : 'trading'}`
              }
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
            <div className="divide-y divide-white/10">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => onTransactionClick?.(transaction)}
                  className="p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    {/* Transaction Info */}
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {transaction.type === 'referral' ? 'Referral Bonus' : 
                           `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} ${transaction.symbol}`}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {transaction.type !== 'referral' && `${transaction.quantity} shares • `}
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <div className={`font-bold text-lg ${getAmountColor(transaction.total_amount)}`}>
                        {transaction.total_amount >= 0 ? '+' : ''}
                        {formatCurrency(transaction.total_amount)}
                      </div>
                      {transaction.type !== 'referral' && (
                        <div className="text-gray-400 text-sm">
                          @ {formatCurrency(transaction.price)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close filters */}
      {showFilters && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};