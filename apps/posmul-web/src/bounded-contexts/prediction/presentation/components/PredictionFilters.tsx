/**
 * PredictionFilters 컴포넌트
 *
 * 예측 게임 목록의 필터 및 정렬 UI를 제공합니다.
 * prediction 도메인 UI이므로 domain/presentation에 배치합니다.
 */
"use client";

import React, { useState } from "react";

import { Filter, SortDesc, X, ChevronDown } from "lucide-react";

import { Button } from "../../../../shared/ui/components/base";

/** 필터 옵션 */
export interface FilterOptions {
    /** 카테고리 필터 */
    category: string | null;
    /** 상태 필터 */
    status: "ALL" | "ACTIVE" | "ENDED" | "SETTLING";
    /** 최소 참여자 수 */
    minParticipants: number | null;
}

/** 정렬 옵션 */
export type SortOption =
    | "latest"      // 최신순
    | "popular"     // 인기순
    | "ending"      // 마감 임박순
    | "prizePool";  // 상금 풀 순

/** Props */
interface PredictionFiltersProps {
    /** 현재 필터 */
    filters: FilterOptions;
    /** 현재 정렬 */
    sort: SortOption;
    /** 필터 변경 핸들러 */
    onFilterChange: (filters: FilterOptions) => void;
    /** 정렬 변경 핸들러 */
    onSortChange: (sort: SortOption) => void;
    /** 카테고리 목록 */
    categories?: Array<{ id: string; label: string }>;
    /** 추가 클래스명 */
    className?: string;
}

/** 정렬 옵션 레이블 */
const SORT_LABELS: Record<SortOption, string> = {
    latest: "최신순",
    popular: "인기순",
    ending: "마감 임박순",
    prizePool: "상금 높은순",
};

/** 상태 옵션 레이블 */
const STATUS_LABELS: Record<FilterOptions["status"], string> = {
    ALL: "전체",
    ACTIVE: "진행중",
    ENDED: "종료됨",
    SETTLING: "정산중",
};

/** 기본 카테고리 목록 */
const DEFAULT_CATEGORIES = [
    { id: "SPORTS", label: "스포츠" },
    { id: "POLITICS", label: "정치" },
    { id: "ENTERTAINMENT", label: "엔터테인먼트" },
    { id: "INVEST", label: "경제" },
];

/**
 * 예측 게임 필터/정렬 컴포넌트
 */
export const PredictionFilters: React.FC<PredictionFiltersProps> = ({
    filters,
    sort,
    onFilterChange,
    onSortChange,
    categories = DEFAULT_CATEGORIES,
    className = "",
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // 필터 초기화
    const handleReset = () => {
        onFilterChange({
            category: null,
            status: "ALL",
            minParticipants: null,
        });
        onSortChange("latest");
    };

    // 활성 필터 개수
    const activeFilterCount = [
        filters.category !== null,
        filters.status !== "ALL",
        filters.minParticipants !== null,
    ].filter(Boolean).length;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* 상단 바 */}
            <div className="flex items-center justify-between gap-4">
                {/* 필터 토글 */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                    {activeFilterCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </Button>

                {/* 정렬 드롭다운 */}
                <div className="flex items-center gap-2">
                    <SortDesc className="w-4 h-4 text-slate-400" />
                    <select
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value as SortOption)}
                        className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.entries(SORT_LABELS).map(([value, label]) => (
                            <option key={value} value={value} className="bg-slate-900 text-white">
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 필터 패널 */}
            {isFilterOpen && (
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 space-y-4">
                    {/* 카테고리 */}
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">카테고리</label>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={filters.category === null ? "default" : "ghost"}
                                size="sm"
                                className={filters.category === null
                                    ? "bg-blue-500 text-white"
                                    : "text-slate-400 bg-white/5"
                                }
                                onClick={() => onFilterChange({ ...filters, category: null })}
                            >
                                전체
                            </Button>
                            {categories.map((cat) => (
                                <Button
                                    key={cat.id}
                                    variant={filters.category === cat.id ? "default" : "ghost"}
                                    size="sm"
                                    className={filters.category === cat.id
                                        ? "bg-blue-500 text-white"
                                        : "text-slate-400 bg-white/5"
                                    }
                                    onClick={() => onFilterChange({ ...filters, category: cat.id })}
                                >
                                    {cat.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* 상태 */}
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">상태</label>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(STATUS_LABELS) as FilterOptions["status"][]).map((status) => (
                                <Button
                                    key={status}
                                    variant={filters.status === status ? "default" : "ghost"}
                                    size="sm"
                                    className={filters.status === status
                                        ? "bg-green-500 text-white"
                                        : "text-slate-400 bg-white/5"
                                    }
                                    onClick={() => onFilterChange({ ...filters, status })}
                                >
                                    {STATUS_LABELS[status]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* 하단 액션 */}
                    <div className="flex justify-end pt-2 border-t border-white/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400"
                            onClick={handleReset}
                        >
                            <X className="w-4 h-4 mr-1" />
                            필터 초기화
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionFilters;
