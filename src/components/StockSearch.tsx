import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Building2, Globe, Loader2, X } from 'lucide-react';
import { finnhubAPI, SearchResult } from '../lib/finnhub';

interface StockSearchProps {
  onStockSelect: (stock: any) => void;
  onClose: () => void;
  initialSearchTerm?: string;
}

export const StockSearch: React.FC<StockSearchProps> = ({ onStockSelect, onClose, initialSearchTerm = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // If there's an initial search term, trigger search
    if (initialSearchTerm.trim().length >= 2) {
      performSearch(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search for empty or very short terms
    if (searchTerm.length < 2) {
      setSearchResults(null);
      return;
    }

    // Debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const performSearch = async (term: string) => {
    try {
      setLoading(true);
      setError('');
      
      const results = await finnhubAPI.searchStocks(term);
      setSearchResults(results);
      
    } catch (err) {
      setError('Failed to search stocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockClick = (stock: any) => {
    onStockSelect(stock);
  };

  const getStockTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'common stock':
        return <TrendingUp className="w-4 h-4" />;
      case 'etf':
        return <Building2 className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getStockTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'common stock':
        return 'text-blue-400';
      case 'etf':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 pt-20">
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full border border-white/10 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">Search Stocks</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-gray-800/50 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              placeholder="Search for stocks (e.g., AAPL, Tesla, Microsoft)..."
            />
          </div>
          
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <p className="text-gray-400 text-sm mt-2">Type at least 2 characters to search</p>
          )}
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
              <span className="text-gray-300">Searching stocks...</span>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {searchResults && !loading && (
            <div className="p-6">
              {searchResults.count === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No stocks found for "{searchTerm}"</p>
                  <p className="text-gray-500 text-sm mt-2">Try searching with a different term</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-gray-300 text-sm">
                      Found {searchResults.count} result{searchResults.count !== 1 ? 's' : ''} for "{searchTerm}"
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {searchResults.result.slice(0, 10).map((stock, index) => (
                      <div
                        key={`${stock.symbol}-${index}`}
                        onClick={() => handleStockClick(stock)}
                        className="group bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 rounded-xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 border border-white/10 hover:border-blue-500/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                              <span className="text-blue-400 font-bold text-lg">
                                {stock.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-lg">{stock.symbol}</h4>
                              <p className="text-gray-300 text-sm line-clamp-1">
                                {stock.description}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {stock.displaySymbol}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`flex items-center ${getStockTypeColor(stock.type)}`}>
                            {getStockTypeIcon(stock.type)}
                            <span className="ml-2 text-sm font-medium">{stock.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {!searchTerm && !loading && (
            <div className="p-6 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Start typing to search for stocks</p>
              <p className="text-gray-500 text-sm mt-2">Search by symbol, company name, or description</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};