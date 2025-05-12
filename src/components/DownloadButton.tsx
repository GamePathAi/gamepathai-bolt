import React, { useState } from 'react';
import { Download, AlertTriangle, Check } from 'lucide-react';
import { downloadApp, detectOS } from '../lib/downloads';
import { DownloadErrorHandler } from './DownloadErrorHandler';

export const DownloadButton: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const handleDownload = async () => {
    setError(null);
    setSuccess(false);
    setIsDownloading(true);
    setShowErrorDetails(false);

    try {
      const os = detectOS();
      
      if (os === 'unknown') {
        setError('Could not detect your operating system. Please select a download option manually.');
        setIsDownloading(false);
        setShowErrorDetails(true);
        return;
      }

      // Just get the URL and open it in a new tab
      const result = await downloadApp({ 
        platform: os,
        direct: true
      });

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Download failed');
      }

      // Open the download URL in a new tab
      window.open(result.url, '_blank', 'noopener,noreferrer');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed. Please try again later.');
      setShowErrorDetails(true);
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
          ${error && !showErrorDetails ? 'animate-shake' : ''}
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

      {error && showErrorDetails && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10">
          <DownloadErrorHandler 
            error={error} 
            onRetry={handleDownload} 
          />
        </div>
      )}
    </div>
  );
};