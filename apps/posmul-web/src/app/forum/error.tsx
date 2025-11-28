"use client";

import { BaseErrorUI } from "../../shared/ui";

interface ForumErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ForumError({ error, reset }: ForumErrorProps) {
  return (
    <BaseErrorUI
      error={error}
      onRetry={reset}
      onGoHome={() => (window.location.href = "/")}
      showDetails={process.env.NODE_ENV === "development"}
    />
  );
}
