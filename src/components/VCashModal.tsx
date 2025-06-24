import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Filter, ArrowUpDown, Activity } from 'lucide-react';
import { Transaction, databaseService } from '../lib/database';

interface VCashModalProps {
  userId: string;
  vCashBalance: number;
  onClose: () => void;
}

type FilterType = 'all' | 'inflow' | 'outflow';

export const VCashModal: React.FC<VCashModalProps> = ({ userId, vCashBalance, onClose }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [userId]);

  useEffect(() => {
    applyFilter();
  }, [transactions, activeFilter, sortOrder]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const userTransactions = await databaseService.getUserTransactions(userId, 100);
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
    if (activeFilter === 'inflow') {
      filtered = transactions.filter(t => t.total_amount > 0);
    } else if (activeFilter === 'outflow') {
      filtered = transactions.filter(t => t.total_amount < 0);
    }

    // Apply sort order
    filtered = [...filtered].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });

    setFilteredTransactions(filtered);
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

  const getTransactionIcon = (amount: number, type: string) => {
    if (type === 'referral') return <Activity className="w-5 h-5 text-purple-400" />;
    return amount > 0 ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />;
  };

  const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-400';
    if (amount < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const totalInflow = transactions.filter(t => t.total_amount > 0).reduce((sum, t) => sum + t.total_amount, 0);
  const totalOutflow = transactions.filter(t => t.total_amount < 0).reduce((sum, t) => sum + Math.abs(t.total_amount), 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] border border-white/20 overflow-hidden"
           style={{
             boxShadow: `
               0 25px 50px -12px rgba(0, 0, 0, 0.8),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
               0 0 0 1px rgba(255, 255, 255, 0.1)
             `
           }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mr-4 border border-green-400/30">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">V-Cash Balance</h3>
              <p className="text-gray-400">Transaction history and balance details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Balance Summary */}
        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(vCashBalance)}</p>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Total Inflow</p>
                <p className="text-2xl font-bold text-green-400">+{formatCurrency(totalInflow)}</p>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Total Outflow</p>
                <p className="text-2xl font-bold text-red-400">-{formatCurrency(totalOutflow)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">Transaction History</h4>
            <div className="flex items-center space-x-4">
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors group px-3 py-2 bg-gray-800/50 rounded-lg border border-white/10"
                >
                  <Filter className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
                  {activeFilter === 'all' ? 'All' : activeFilter === 'inflow' ? 'Inflow' : 'Outflow'}
                </button>
                
                {showFilters && (
                  <div className="absolute top-full right-0 mt-2 bg-gray-800/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-10 min-w-[120px]">
                    <div className="p-2">
                      {(['all', 'inflow', 'outflow'] as FilterType[]).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => {
                            setActiveFilter(filter);
                            setShowFilters(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                            activeFilter === filter 
                              ? 'text-blue-400 bg-blue-500/10 border border-blue-400/50'
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

              {/* Sort Button */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors group px-3 py-2 bg-gray-800/50 rounded-lg border border-white/10"
              >
                <ArrowUpDown className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
                {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
              <span className="text-gray-300">Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-6 text-center">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No transactions found</p>
              <p className="text-gray-500 text-sm">
                {activeFilter === 'all' 
                  ? 'Your transaction history will appear here' 
                  : `No ${activeFilter} transactions found`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center mr-4">
                        {getTransactionIcon(transaction.total_amount, transaction.type)}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {transaction.type === 'referral' ? 'Referral Bonus' : 
                           `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} ${transaction.symbol}`}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {transaction.description}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${getAmountColor(transaction.total_amount)}`}>
                        {transaction.total_amount >= 0 ? '+' : ''}
                        {formatCurrency(transaction.total_amount)}
                      </div>
                      {transaction.type !== 'referral' && (
                        <div className="text-gray-400 text-sm">
                          {transaction.quantity} shares @ {formatCurrency(transaction.price)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
};