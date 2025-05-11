import React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { getDownloadUrl } from '../lib/downloads';

export const DownloadFallback: React.FC = () => {
  return (
    <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Download GamePath AI</h2>
      <p className="text-gray-400 mb-6">
        Choose your platform to download the latest version of GamePath AI:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Windows Download */}
        <a 
          href={getDownloadUrl('windows')}
          className="flex flex-col items-center p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-3">
            <Download className="text-cyan-400" size={24} />
          </div>
          <h3 className="text-white font-medium mb-1">Windows</h3>
          <p className="text-xs text-gray-400 text-center">
            Windows 10/11 (64-bit)
          </p>
          <div className="mt-3 flex items-center text-cyan-400 text-sm">
            <ExternalLink size={14} className="mr-1" />
            Download
          </div>
        </a>
        
        {/* macOS Download */}
        <a 
          href={getDownloadUrl('mac')}
          className="flex flex-col items-center p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
            <Download className="text-purple-400" size={24} />
          </div>
          <h3 className="text-white font-medium mb-1">macOS</h3>
          <p className="text-xs text-gray-400 text-center">
            macOS 11+ (Intel/Apple Silicon)
          </p>
          <div className="mt-3 flex items-center text-purple-400 text-sm">
            <ExternalLink size={14} className="mr-1" />
            Download
          </div>
        </a>
        
        {/* Linux Download */}
        <a 
          href={getDownloadUrl('linux')}
          className="flex flex-col items-center p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
            <Download className="text-green-400" size={24} />
          </div>
          <h3 className="text-white font-medium mb-1">Linux</h3>
          <p className="text-xs text-gray-400 text-center">
            Ubuntu, Debian, Fedora (AppImage)
          </p>
          <div className="mt-3 flex items-center text-green-400 text-sm">
            <ExternalLink size={14} className="mr-1" />
            Download
          </div>
        </a>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        By downloading, you agree to our <a href="#" className="text-cyan-400 hover:underline">Terms of Service</a> and <a href="#" className="text-cyan-400 hover:underline">Privacy Policy</a>
      </div>
    </div>
  );
};