import React, { useEffect, useState } from 'react';

export const GameDetectionDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Collect debug information
    const info = {
      window: typeof window !== 'undefined',
      electronAPI: typeof window !== 'undefined' && window.electronAPI !== undefined,
      electronAPIKeys: typeof window !== 'undefined' && window.electronAPI ? Object.keys(window.electronAPI) : [],
      process: typeof process !== 'undefined',
      processVersions: typeof process !== 'undefined' && process.versions ? Object.keys(process.versions) : [],
      electronVersion: typeof process !== 'undefined' && process.versions ? process.versions.electron : undefined,
      platform: typeof process !== 'undefined' ? process.platform : undefined,
      systemInfo: typeof window !== 'undefined' && window.electronAPI && window.electronAPI.system ? window.electronAPI.system : undefined,
    };

    setDebugInfo(info);

    // Log debug info to console
    console.log('=== DEBUG ELECTRON DETECTION ===');
    console.log('window:', typeof window);
    console.log('window.electronAPI:', window.electronAPI);
    console.log('process:', typeof process);
    console.log('process.versions:', process?.versions);
    console.log('process.versions.electron:', process?.versions?.electron);
    console.log('isElectron():', 
      typeof window !== 'undefined' && 
      window.electronAPI !== undefined
    );
  }, []);

  if (!debugInfo) {
    return <div>Loading debug info...</div>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white">
      <h3 className="text-lg font-medium mb-4">Electron Detection Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>window defined:</span>
          <span className={debugInfo.window ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.window ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>window.electronAPI defined:</span>
          <span className={debugInfo.electronAPI ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.electronAPI ? 'Yes' : 'No'}
          </span>
        </div>
        
        {debugInfo.electronAPI && (
          <div>
            <span>electronAPI keys:</span>
            <pre className="bg-gray-900 p-2 rounded mt-1 text-xs overflow-auto">
              {JSON.stringify(debugInfo.electronAPIKeys, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>process defined:</span>
          <span className={debugInfo.process ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.process ? 'Yes' : 'No'}
          </span>
        </div>
        
        {debugInfo.process && (
          <>
            <div className="flex justify-between">
              <span>process.versions.electron:</span>
              <span className={debugInfo.electronVersion ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.electronVersion || 'Not defined'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>process.platform:</span>
              <span>{debugInfo.platform || 'Not defined'}</span>
            </div>
          </>
        )}
        
        <div className="flex justify-between">
          <span>isElectron() result:</span>
          <span className={debugInfo.electronAPI ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.electronAPI ? 'true' : 'false'}
          </span>
        </div>
        
        {debugInfo.systemInfo && (
          <div>
            <span>System Info:</span>
            <pre className="bg-gray-900 p-2 rounded mt-1 text-xs overflow-auto">
              {JSON.stringify(debugInfo.systemInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};