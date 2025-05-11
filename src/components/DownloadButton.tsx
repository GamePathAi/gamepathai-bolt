import React, { useState } from 'react';
import { Download, AlertTriangle, Check } from 'lucide-react';
import { downloadApp, detectOS } from '../lib/downloads';

export const DownloadButton: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    setError(null);
    setSuccess(false);
    setIsDownloading(true);

    try {
      const os = detectOS();
      
      if (os === 'unknown') {
        setError('Could not detect your operating system. Please select a download option manually.');
        setIsDownloading(false);
        return;
      }

      const result = await downloadApp({ platform: os });

      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed. Please try again later.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getOSName = () => {
    const os = detectOS();
    return os === 'windows' ? 'Windows' :
           os === 'mac' ? 'macOS' :
           os === 'linux' ? 'Linux' :
           'Your Device';
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`
          px-6 py-3 bg-gray-800 border border-gray-700
          text-white rounded-lg font-medium 
          hover:bg-gray-700 hover:border-gray-600
          transition-all duration-200 
          flex items-center
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'animate-shake' : ''}
        `}
      >
        {isDownloading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Downloading...
          </>
        ) : success ? (
          <>
            <Check className="mr-2 text-green-400" size={20} />
            Download Started
          </>
        ) : (
          <>
            <Download className="mr-2" size={20} />
            Download for {getOSName()}
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg z-10">
          <div className="flex items-center text-red-400">
            <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Try the direct download links:
            <div className="flex flex-wrap gap-2 mt-1">
              <a 
                href="https://downloads.gamepath.ai/releases/latest/GamePathAI-Setup.exe" 
                className="text-cyan-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Windows
              </a>
              <a 
                href="https://downloads.gamepath.ai/releases/latest/GamePathAI.dmg" 
                className="text-cyan-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                macOS
              </a>
              <a 
                href="https://downloads.gamepath.ai/releases/latest/GamePathAI.AppImage" 
                className="text-cyan-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Linux
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};