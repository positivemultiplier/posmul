interface PredictionLayoutProps {
  children: React.ReactNode;
}

export default function PredictionLayout({ children }: PredictionLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {children}
      </div>
    </div>
  );
}
