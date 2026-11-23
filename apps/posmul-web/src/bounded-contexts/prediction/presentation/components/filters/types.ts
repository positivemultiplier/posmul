// 필터 옵션 타입 정의
export type FilterOptions = {
  search: string;
  categories: string[];
  statuses: string[];
  stakeRange: {
    min: number;
    max: number;
  };
  timeFilter: "all" | "1hour" | "today" | "week";
};

// 필터 컴포넌트 Props 타입
export type PredictionGameFilterProps = {
  onFilterChange: (filters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
};

// 카테고리 정의
export const CATEGORIES = [
  {
    id: "sports",
    label: "스포츠",
    icon: "",
    color: "bg-green-100 text-green-800",
  },
  {
    id: "politics",
    label: "정치",
    icon: "",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "economy",
    label: "경제",
    icon: "",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "entertainment",
    label: "엔터테인먼트",
    icon: "",
    color: "bg-purple-100 text-purple-800",
  },
] as const;

// 상태 정의
export const STATUSES = [
  { id: "active", label: "활성", color: "bg-green-100 text-green-800" },
  { id: "pending", label: "대기 중", color: "bg-yellow-100 text-yellow-800" },
  { id: "ended", label: "종료", color: "bg-gray-100 text-gray-800" },
] as const;

// 시간 필터 정의
export const TIME_FILTERS = [
  { id: "all", label: "전체" },
  { id: "1hour", label: "1시간 내" },
  { id: "today", label: "오늘" },
  { id: "week", label: "이번 주" },
] as const;
