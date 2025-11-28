"use client";

import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Grid, List } from 'lucide-react';
import { useState } from 'react';

export const MobileGameNavigation = ({
  searchQuery,
  onSearchChange,
  viewMode = 'grid', // 'grid' | 'list'
  onViewModeChange,
  onFilterToggle,
  filterCount = 0
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      {/* Search Bar */}
      <div className="px-4 py-3">
        <motion.div
          animate={{
            scale: isSearchFocused ? 1.02 : 1,
          }}
          className="relative"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="예측 게임 검색..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                ×
              </div>
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Filter and View Controls */}
      <div className="px-4 pb-3 flex items-center justify-between">
        {/* Left side - Filters */}
        <div className="flex items-center space-x-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onFilterToggle}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors
              ${filterCount > 0
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-100 border-gray-300 text-gray-700'
              }
            `}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>필터</span>
            {filterCount > 0 && (
              <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {filterCount}
              </div>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 border border-gray-300 text-gray-700"
          >
            <Filter className="w-4 h-4" />
            <span>정렬</span>
          </motion.button>
        </div>

        {/* Right side - View Mode */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange && onViewModeChange('grid')}
            className={`
              p-1.5 rounded-md transition-colors
              ${viewMode === 'grid'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            <Grid className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange && onViewModeChange('list')}
            className={`
              p-1.5 rounded-md transition-colors ml-1
              ${viewMode === 'list'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            <List className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Active Filters Display */}
      {filterCount > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-3 border-t border-gray-100"
        >
          <div className="flex items-center space-x-2 pt-2">
            <span className="text-xs text-gray-600">활성 필터:</span>
            <div className="flex flex-wrap gap-1">
              {/* Mock active filters - 실제 구현에서는 props로 받기 */}
              <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                <span>스포츠</span>
                <button className="text-blue-500 hover:text-blue-700">×</button>
              </div>
              <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                <span>진행중</span>
                <button className="text-blue-500 hover:text-blue-700">×</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
