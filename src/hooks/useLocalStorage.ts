import { useState, useCallback } from 'react';

export function useLocalStorage() {
  const [error, setError] = useState<Error | null>(null);

  const getItem = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get item from localStorage');
      setError(error);
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  }, []);

  const setItem = useCallback(async <T>(key: string, value: T | null): Promise<boolean> => {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set item in localStorage');
      setError(error);
      console.error(`Error setting item ${key} in localStorage:`, error);
      return false;
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<boolean> => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove item from localStorage');
      setError(error);
      console.error(`Error removing item ${key} from localStorage:`, error);
      return false;
    }
  }, []);

  return {
    getItem,
    setItem,
    removeItem,
    error
  };
}