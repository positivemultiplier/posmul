"use client";

import { BaseErrorUI } from "../../shared/ui";

interface InvestmentErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function InvestmentError({ error, reset }: InvestmentErrorProps) {
  return (
    <BaseErrorUI
      error={error}
      onRetry={reset}
      onGoHome={() => window.location.href = '/'}
      showDetails={process.env.NODE_ENV === 'development'}
    />
  );
}
