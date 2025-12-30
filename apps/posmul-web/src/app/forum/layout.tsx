/**
 * Forum Layout
 *
 * Layout for forum domain:
 * - News: 공공 뉴스, 지식 획득
 * - Budget: 예산 감시
 * - Brainstorming & Debate: 공론화
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

interface ForumLayoutProps {
  children: React.ReactNode;
}

export default function ForumLayout({ children }: ForumLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
