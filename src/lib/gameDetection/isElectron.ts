import { create } from 'zustand';

/**
 * Utility function to detect if we're running in Electron environment
 */
export function isElectron(): boolean {
  // Check if window.electronAPI exists
  const hasElectronAPI = typeof window !== 'undefined' && 
                         window.electronAPI !== undefined;
  
  // Log detection result for debugging
  console.log('isElectron() check:', {
    hasElectronAPI,
    windowExists: typeof window !== 'undefined',
    electronAPIExists: typeof window !== 'undefined' && window.electronAPI !== undefined,
    electronAPIKeys: typeof window !== 'undefined' && window.electronAPI ? Object.keys(window.electronAPI) : []
  });
  
  return hasElectronAPI;
}