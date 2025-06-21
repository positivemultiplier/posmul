/**
 * Navigation Types for Different Domains
 *
 * Each domain has its own navigation structure based on Project_Features.md
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

// Base navigation types
export interface NavigationItem {
  slug: string;
  title: string;
  description: string;
  icon?: string;
}

export interface NavigationCategory extends NavigationItem {
  subcategories?: NavigationItem[];
}

// Domain-specific navigation structures
export interface PredictionNavigation {
  invest: NavigationCategory;
  sports: NavigationCategory;
  entertainment: NavigationCategory;
  politics: NavigationCategory;
  "user-suggestions": NavigationCategory;
}

export interface InvestmentNavigation {
  "local-league": NavigationCategory;
  "major-league": NavigationCategory;
  "cloud-funding": NavigationCategory;
  common: NavigationCategory;
}

export interface DonationNavigation {
  direct: NavigationCategory;
  institute: NavigationCategory;
  "opinion-leader": NavigationCategory;
  common: NavigationCategory;
}

export interface ForumNavigation {
  news: NavigationCategory;
  debate: NavigationCategory;
  brainstorming: NavigationCategory;
  budget: NavigationCategory;
}

// Domain types
export type DomainType =
  | "prediction"
  | "investment"
  | "donation"
  | "forum"
  | "ranking"
  | "mypage";

// Navigation configuration
export interface DomainNavigationConfig {
  domain: DomainType;
  title: string;
  description: string;
  icon: string;
  primaryColor: string;
  navigation:
    | PredictionNavigation
    | InvestmentNavigation
    | DonationNavigation
    | ForumNavigation;
}

// Route patterns for each domain
export interface RoutePattern {
  domain: DomainType;
  pattern: string;
  example: string;
}

export const ROUTE_PATTERNS: RoutePattern[] = [
  {
    domain: "prediction",
    pattern: "/prediction/[category]/[subcategory]/[slug]?",
    example: "/prediction/sports/soccer/soccer-001",
  },
  {
    domain: "investment",
    pattern: "/investment/[league]/[category]/[id]?",
    example: "/investment/local-league/식품/merchant-123",
  },
  {
    domain: "donation",
    pattern: "/donation/[type]/[category]/[id]?",
    example: "/donation/direct/의류/campaign-456",
  },
  {
    domain: "forum",
    pattern: "/forum/[activity]/[scope]/[topic]?",
    example: "/forum/debate/nation/healthcare-policy",
  },
];
