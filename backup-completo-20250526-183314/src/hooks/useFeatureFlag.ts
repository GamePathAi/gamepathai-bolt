import { useState, useEffect } from 'react';
import { featureManager } from '../lib/deployment/featureManager';
import { useAuthStore } from '../stores/authStore';

export function useFeatureFlag(featureId: string) {
  const [isEnabled, setIsEnabled] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    
    const enabled = featureManager.isFeatureEnabled(featureId, user.id);
    setIsEnabled(enabled);
  }, [featureId, user]);

  return isEnabled;
}