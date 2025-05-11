import React from 'react';
import { Download } from 'lucide-react';

export const DownloadButton: React.FC = () => {
  const handleDownload = () => {
    // Replace with actual download URLs once builds are available
    const os = detectOS();
    const downloadUrls = {
      windows: 'https://downloads.gamepath.ai/releases/latest/GamePathAI-Setup.exe',
      mac: 'https://downloads.gamepath.ai/releases/latest/GamePathAI.dmg',
      linux: 'https://downloads.gamepath.ai/releases/latest/GamePathAI.AppImage'
    };

    window.location.href = downloadUrls[os];
  };

  const detectOS = (): 'windows' | 'mac' | 'linux' => {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) return 'windows';
    if (platform.includes('mac')) return 'mac';
    return 'linux';
  };

  return (
    <button
      onClick={handleDownload}
      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 transition-all duration-200 flex items-center"
    >
      <Download className="mr-2" size={20} />
      Download Desktop App
    </button>
  );
};