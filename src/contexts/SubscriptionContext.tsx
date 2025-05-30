// src/contexts/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SubscriptionContextType {
  isPro: boolean;
  trialDaysLeft: number;
  startTrial: () => void;
  upgradeToPro: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [trialStartDate, setTrialStartDate] = useState<Date | null>(null);
  
  // Carregar estado do localStorage
  useEffect(() => {
    const savedPro = localStorage.getItem('gamepathai_pro');
    const savedTrial = localStorage.getItem('gamepathai_trial_start');
    
    if (savedPro === 'true') {
      setIsPro(true);
    } else if (savedTrial) {
      const trialDate = new Date(savedTrial);
      setTrialStartDate(trialDate);
      
      // Verificar se ainda está no período de trial
      const daysPassed = Math.floor((Date.now() - trialDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPassed <= 3) {
        setIsPro(true);
      }
    }
  }, []);
  
  const trialDaysLeft = trialStartDate 
    ? Math.max(0, 3 - Math.floor((Date.now() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 3;
    
  const startTrial = () => {
    const now = new Date();
    setTrialStartDate(now);
    setIsPro(true);
    localStorage.setItem('gamepathai_trial_start', now.toISOString());
  };
  
  const upgradeToPro = () => {
    setIsPro(true);
    localStorage.setItem('gamepathai_pro', 'true');
  };
  
  return (
    <SubscriptionContext.Provider value={{ isPro, trialDaysLeft, startTrial, upgradeToPro }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
