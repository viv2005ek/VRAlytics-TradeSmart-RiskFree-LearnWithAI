import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { StockSearch } from './StockSearch';

interface SearchStocksBarProps {
  onStockSelect?: (stock: any) => void;
  className?: string;
}

export const SearchStocksBar: React.FC<SearchStocksBarProps> = ({ 
  onStockSelect,
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showStockSearch, setShowStockSearch] = useState(false);

  const handleSearchClick = () => {
    setShowStockSearch(true);
  };

  const handleStockSearchSelect = (stock: any) => {
    setShowStockSearch(false);
    if (onStockSelect) {
      onStockSelect(stock);
    }
  };

  const handleCloseSearch = () => {
    setShowStockSearch(false);
  };

  return (
    <>
      <div className={`backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl p-6 ${className}`}
           style={{
             boxShadow: `
               0 8px 32px 0 rgba(0, 0, 0, 0.6),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
               0 0 0 1px rgba(255, 255, 255, 0.02)
             `
           }}>
        <h3 className="text-lg font-medium text-white mb-4">Search Stocks</h3>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={handleSearchClick}
            className="block w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 cursor-pointer hover:bg-black/40"
            placeholder="Search stocks..."
            readOnly
          />
        </div>
        <p className="text-gray-400 text-sm mt-3">
          Click to search for any stock symbol or company name.
        </p>
      </div>

      {/* Stock Search Modal */}
      {showStockSearch && (
        <StockSearch
          onStockSelect={handleStockSearchSelect}
          onClose={handleCloseSearch}
          initialSearchTerm={searchTerm}
        />
      )}
    </>
  );
};