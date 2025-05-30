export function isElectron(): boolean {
  const checks = {
    hasElectronInUserAgent: typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron'),
    hasRequire: typeof window !== 'undefined' && typeof window.require === 'function',
    hasProcess: typeof window !== 'undefined' && typeof window.process === 'object',
    hasElectronAPI: typeof window !== 'undefined' && typeof window.electronAPI === 'object'
  };
  
  const isInElectron = checks.hasElectronInUserAgent || checks.hasRequire || checks.hasElectronAPI;
  
  if (typeof window !== 'undefined') {
    console.log('isElectron() check:', { ...checks, result: isInElectron });
  }
  
  return isInElectron;
}
