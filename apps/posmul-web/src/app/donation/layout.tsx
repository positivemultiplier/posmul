/**
 * Donation Layout
 *
 * Layout for donation domain - Forum 스타일 다크 테마
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

interface DonationLayoutProps {
  children: React.ReactNode;
}

export default function DonationLayout({ children }: DonationLayoutProps) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
    </div>
  );
}
