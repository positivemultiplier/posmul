/**
 * Navigation Types for Different Domains
 *
 * Each domain has its own navigation structure based on Project_Features.md
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
// Sidebar specific types
export const SIDEBAR_ICON_SIZE = 24;
export const ROUTE_PATTERNS = [
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
