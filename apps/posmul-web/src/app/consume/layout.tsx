/**
 * Consume Layout
 *
 * Layout for consume domain with Major/Minor League and Cloud Funding.
 *
 * @author PosMul Development Team
 * @since 2025-11
 */

interface ConsumeLayoutProps {
  children: React.ReactNode;
}

export default function ConsumeLayout({ children }: ConsumeLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
