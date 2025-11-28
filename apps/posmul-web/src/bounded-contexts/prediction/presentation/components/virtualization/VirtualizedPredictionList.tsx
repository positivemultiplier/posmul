"use client";

import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useState, useCallback, useMemo } from 'react';
import { PredictionGameRow } from './PredictionGameRow';

export const VirtualizedPredictionList = ({
  games = [],
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  itemHeight = 200,
  height = 600,
  onGameSelect
}) => {
  const [selectedGameId, setSelectedGameId] = useState(null);

  // 아이템이 로드되었는지 확인하는 함수
  const isItemLoaded = useCallback((index) => {
    return !!games[index];
  }, [games]);

  // 더 많은 아이템을 로드하는 함수
  const loadMoreItems = useCallback(async (startIndex, stopIndex) => {
    if (!isNextPageLoading && hasNextPage && loadNextPage) {
      await loadNextPage(startIndex, stopIndex);
    }
  }, [isNextPageLoading, hasNextPage, loadNextPage]);

  // 전체 아이템 수 계산 (로딩 중인 항목 포함)
  const itemCount = hasNextPage ? games.length + 1 : games.length;

  // 각 행을 렌더링하는 컴포넌트
  const Row = useCallback(({ index, style }) => {
    let game;
    let isLoading = false;

    // 로딩 중인 항목인지 확인
    if (index >= games.length) {
      isLoading = true;
      game = null;
    } else {
      game = games[index];
    }

    return (
      <div style={style}>
        <PredictionGameRow
          game={game}
          isLoading={isLoading}
          isSelected={selectedGameId === game?.id}
          onSelect={(game) => {
            setSelectedGameId(game?.id);
            onGameSelect && onGameSelect(game);
          }}
        />
      </div>
    );
  }, [games, selectedGameId, onGameSelect]);

  // 스크롤 위치에 따른 성능 최적화
  const memoizedRow = useMemo(() => Row, [Row]);

  return (
    <div className="h-full">
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
        threshold={3} // 마지막 3개 항목에서 미리 로딩 시작
        minimumBatchSize={10} // 한 번에 최소 10개씩 로드
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={height}
            width="100%"
            itemCount={itemCount}
            itemSize={itemHeight}
            onItemsRendered={onItemsRendered}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            overscanCount={5} // 보이지 않는 영역에도 5개 항목 미리 렌더링
          >
            {memoizedRow}
          </List>
        )}
      </InfiniteLoader>

      {/* 로딩 표시기 */}
      {isNextPageLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">더 많은 게임 로딩 중...</span>
        </div>
      )}

      {/* 더 이상 로드할 데이터가 없을 때 */}
      {!hasNextPage && games.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>모든 게임을 확인했습니다</p>
          <p className="text-sm">총 {games.length}개의 예측 게임</p>
        </div>
      )}

      {/* 빈 상태 */}
      {!hasNextPage && games.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="w-16 h-16 mb-4 opacity-50">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-lg font-medium">예측 게임이 없습니다</p>
          <p className="text-sm">새로운 게임이 추가되면 여기에 표시됩니다</p>
        </div>
      )}
    </div>
  );
};
