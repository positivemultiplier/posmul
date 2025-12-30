/**
 * Prediction Layout
 *
 * Layout for prediction domain - 다크 테마 적용
 */
interface PredictionLayoutProps {
  children: React.ReactNode;
}

export default function PredictionLayout({ children }: PredictionLayoutProps) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
    </div>
  );
}
