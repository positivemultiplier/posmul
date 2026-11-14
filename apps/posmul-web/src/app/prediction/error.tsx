"use client";

import { BaseErrorUI } from "../../shared/ui/components/feedback/BaseErrorUI";

interface PredictionErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PredictionError({
  error,
  reset,
}: PredictionErrorProps) {
  return (
    <BaseErrorUI
      error={error}
      onRetry={reset}
      onGoHome={() => (window.location.href = "/")}
      showDetails={process.env.NODE_ENV === "development"}
    />
  );
}
