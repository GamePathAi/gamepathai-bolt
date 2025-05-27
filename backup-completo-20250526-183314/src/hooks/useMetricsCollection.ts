import { useEffect } from 'react';
import { dataCollector } from '../lib/ml/dataCollection';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';

export function useMetricsCollection() {
  const { user } = useAuthStore();
  const { userGames } = useGameStore();

  useEffect(() => {
    if (!user || userGames.length === 0) return;

    dataCollector.startCollection();

    return () => {
      dataCollector.stopCollection();
    };
  }, [user, userGames]);
}