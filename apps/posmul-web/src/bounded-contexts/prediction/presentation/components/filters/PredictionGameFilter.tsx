"use client";

import { useState, useCallback } from 'react';
import { Search, Filter, X, Calendar, DollarSign } from 'lucide-react';
import { Button, Card, Badge } from '../../../../../shared/ui/components/base';

const CATEGORIES = [
  { id: 'sports', label: '스포츠', icon: '⚽', color: 'bg-green-100 text-green-800' },
  { id: 'politics', label: '정치', icon: '🗳️', color: 'bg-blue-100 text-blue-800' },
  { id: 'economy', label: '경제', icon: '📈', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'entertainment', label: '엔터테인먼트', icon: '🎭', color: 'bg-purple-100 text-purple-800' },
];

const STATUSES = [
  { id: 'active', label: '활성', color: 'bg-green-100 text-green-800' },
  { id: 'pending', label: '대기 중', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'ended', label: '종료', color: 'bg-gray-100 text-gray-800' },
];

const TIME_FILTERS = [
  { id: 'all', label: '전체' },
  { id: '1hour', label: '1시간 내' },
  { id: 'today', label: '오늘' },
  { id: 'week', label: '이번 주' },
];

export const PredictionGameFilter = ({ onFilterChange, totalCount, filteredCount }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    statuses: [],
    stakeRange: { min: 0, max: 10000 },
    timeFilter: 'all'
  });

  const updateFilters = useCallback((newFilters) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  }, [filters, onFilterChange]);

  const handleSearchChange = (e) => {
    updateFilters({ search: e.target.value });
  };

  const toggleCategory = (categoryId) => {
    const categories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    updateFilters({ categories });
  };

  const toggleStatus = (statusId) => {
    const statuses = filters.statuses.includes(statusId)
      ? filters.statuses.filter(id => id !== statusId)
      : [...filters.statuses, statusId];
    updateFilters({ statuses });
  };

  const handleStakeRangeChange = (field, value) => {
    updateFilters({
      stakeRange: { ...filters.stakeRange, [field]: value }
    });
  };

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      categories: [],
      statuses: [],
      stakeRange: { min: 0, max: 10000 },
      timeFilter: 'all'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    filters.categories.length +
    filters.statuses.length +
    (filters.stakeRange.min > 0 || filters.stakeRange.max < 10000 ? 1 : 0) +
    (filters.timeFilter !== 'all' ? 1 : 0);

  return (
    <Card className="p-6 mb-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="게임 제목이나 설명으로 검색..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <Button
          variant={isExpanded ? "default" : "outline"}
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          필터
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-blue-600">{filteredCount}</span>개 게임
          {totalCount !== filteredCount && (
            <span> (전체 {totalCount}개 중)</span>
          )}
        </p>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            필터 초기화
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Categories */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">카테고리</h4>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.categories.includes(category.id)
                      ? category.color + ' ring-2 ring-offset-2 ring-gray-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Game Status */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">게임 상태</h4>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status.id}
                  onClick={() => toggleStatus(status.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.statuses.includes(status.id)
                      ? status.color + ' ring-2 ring-offset-2 ring-gray-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stake Range */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              <DollarSign className="w-4 h-4 inline mr-1" />
              베팅 금액 범위
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">최소 금액</label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="100"
                  value={filters.stakeRange.min}
                  onChange={(e) => handleStakeRangeChange('min', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">최대 금액</label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="100"
                  value={filters.stakeRange.max}
                  onChange={(e) => handleStakeRangeChange('max', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {filters.stakeRange.min} PMP - {filters.stakeRange.max} PMP
            </div>
          </div>

          {/* Time Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4 inline mr-1" />
              마감 시간
            </h4>
            <div className="flex flex-wrap gap-2">
              {TIME_FILTERS.map((timeFilter) => (
                <button
                  key={timeFilter.id}
                  onClick={() => updateFilters({ timeFilter: timeFilter.id })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.timeFilter === timeFilter.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {timeFilter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
