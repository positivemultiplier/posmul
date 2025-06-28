"use client";

import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface RealTimePredictionDashboardProps {
  fetchGames: () => Promise<any[] | null>;
}

export function RealTimePredictionDashboard({
  fetchGames,
}: RealTimePredictionDashboardProps) {
  const [games, setGames] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedGames = await fetchGames();
        setGames(fetchedGames);
      } catch (e: any) {
        setError(e.message || "Failed to fetch games");
      } finally {
        setLoading(false);
      }
    };

    getGames();
  }, [fetchGames]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>실시간 예측 현황</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div>로딩 중...</div>}
        {error && <div>오류: {error}</div>}
        {games &&
          games.map((game) => (
            <div key={game.id}>
              <h4>{game.title}</h4>
              <Badge>{game.status}</Badge>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
