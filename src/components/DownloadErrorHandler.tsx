import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { getDownloadUrl, detectOS } from '../lib/downloads';

interface DownloadErrorHandlerProps {
  error: string;
  onRetry: () => void;
}

export const DownloadErrorHandler: React.FC<DownloadErrorHandlerProps> = ({ error, onRetry }) => {
  const [os, setOs] = useState<'windows' | 'mac' | 'linux' | 'unknown'>(detectOS());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Update OS detection when component mounts
    setOs(detectOS());
  }, []);

  const getDirectDownloadUrl = () => {
    return getDownloadUrl(os === 'unknown' ? 'windows' : os);
  };

  return (
    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
      <div className="flex items-start">
        <AlertTriangle className="text-red-400 mt-0.5 mr-3 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1">Download Failed</h3>
          <p className="text-gray-300 text-sm mb-3">{error}</p>
          
          <div className="space-y-3">
            <button 
              onClick={onRetry}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
            
            <a 
              href={getDirectDownloadUrl()}
              className="flex items-center justify-center w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm font-medium transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} className="mr-2" />
              Direct Download Link
            </a>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              {expanded ? "Hide technical details" : "Show technical details"}
            </button>
            
            {expanded && (
              <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700 text-xs text-gray-400">
                <p className="mb-2">Common reasons for download failures:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Network connection issues</li>
                  <li>Firewall or security software blocking the download</li>
                  <li>Server-side issues or maintenance</li>
                  <li>Browser extensions interfering with downloads</li>
                </ul>
                <p className="mt-2">
                  If you continue to experience issues, please try using a different browser or 
                  disabling any download-related extensions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};