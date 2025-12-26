/**
 * Donation Layout
 *
 * Layout for donation domain with navigation structure:
 * 1단: Donation (기부)
 * 2단: direct, institute, opinion-leader, common
 * 3단: Category-specific subcategories
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { Suspense } from "react";

interface DonationLayoutProps {
  children: React.ReactNode;
}

export default function DonationLayout({ children }: DonationLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
