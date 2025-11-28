"use client";

import { useEffect } from "react";
import { Button } from "../../shared/ui";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    대시보드를 불러오는 중 문제가 발생했습니다.
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    잠시 후 다시 시도해주세요.
                </p>
                <Button onClick={reset} variant="default">
                    다시 시도
                </Button>
            </div>
        </div>
    );
}
