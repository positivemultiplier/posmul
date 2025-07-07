/**
 * Navigation Types for Different Domains
 *
 * Each domain has its own navigation structure based on Project_Features.md
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
export interface NavigationItem {
    slug: string;
    title: string;
    description: string;
    icon?: string;
}
export interface NavigationCategory extends NavigationItem {
    subcategories?: NavigationItem[];
}
export declare const SIDEBAR_ICON_SIZE = 24;
export type SidebarCategory = "Dashboard" | "Prediction" | "Investment" | "Donation" | "Forum" | "Community" | "My Page" | "Settings";
export interface SidebarLink extends NavigationItem {
    category: SidebarCategory;
    subLinks?: NavigationItem[];
}
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
export type DomainType = "prediction" | "investment" | "donation" | "forum" | "ranking" | "mypage";
export interface DomainNavigationConfig {
    domain: DomainType;
    title: string;
    description: string;
    icon: string;
    primaryColor: string;
    navigation: PredictionNavigation | InvestmentNavigation | DonationNavigation | ForumNavigation;
}
export interface RoutePattern {
    domain: DomainType;
    pattern: string;
    example: string;
}
export declare const ROUTE_PATTERNS: RoutePattern[];
//# sourceMappingURL=navigation.d.ts.map