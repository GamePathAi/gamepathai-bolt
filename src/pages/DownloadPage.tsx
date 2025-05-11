import React, { useState } from 'react';
import { DownloadButton } from '../components/DownloadButton';
import { DownloadFallback } from '../components/DownloadFallback';
import { Shield, Zap, Network, Cpu } from 'lucide-react';

export const DownloadPage: React.FC = () => {
  const [showFallback, setShowFallback] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Download GamePath AI</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get started with GamePath AI and optimize your gaming experience today
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Automatic Download</h2>
            <p className="text-gray-400 mb-6">
              We'll automatically detect your operating system and download the appropriate version:
            </p>
            
            <div className="flex flex-col items-center">
              <DownloadButton />
              
              <button 
                onClick={() => setShowFallback(true)}
                className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Having trouble? Try manual download options
              </button>
            </div>
          </div>
          
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">System Requirements</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mr-3 mt-1">
                  <Cpu className="text-cyan-400" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Processor</h3>
                  <p className="text-gray-400 text-sm">
                    Intel Core i3 / AMD Ryzen 3 or better
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3 mt-1">
                  <svg className="text-purple-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 19v-3"></path>
                    <path d="M10 19v-3"></path>
                    <path d="M14 19v-3"></path>
                    <path d="M18 19v-3"></path>
                    <path d="M8 11V9"></path>
                    <path d="M16 11V9"></path>
                    <path d="M12 11V9"></path>
                    <path d="M2 15h20"></path>
                    <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Memory</h3>
                  <p className="text-gray-400 text-sm">
                    4 GB RAM minimum, 8 GB RAM recommended
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mr-3 mt-1">
                  <svg className="text-green-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 5H3v14h18V5z"></path>
                    <path d="M21 5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5z"></path>
                    <path d="M7 7h10"></path>
                    <path d="M7 11h10"></path>
                    <path d="M7 15h4"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Storage</h3>
                  <p className="text-gray-400 text-sm">
                    500 MB available space
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mr-3 mt-1">
                  <Network className="text-red-400" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Network</h3>
                  <p className="text-gray-400 text-sm">
                    Internet connection required for activation and updates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {showFallback && <DownloadFallback />}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="text-cyan-400" size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure & Trusted</h3>
            <p className="text-gray-400 text-sm">
              All downloads are digitally signed and verified for your security
            </p>
          </div>
          
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="text-purple-400" size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Lightweight</h3>
            <p className="text-gray-400 text-sm">
              Minimal resource usage with powerful optimization capabilities
            </p>
          </div>
          
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="text-green-400" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Privacy-Focused</h3>
            <p className="text-gray-400 text-sm">
              Your data stays on your device with optional cloud sync
            </p>
          </div>
        </div>
        
        <div className="text-center text-gray-500 text-sm">
          <p>
            GamePath AI © 2025 | <a href="#" className="text-cyan-400 hover:underline">Terms of Service</a> | <a href="#" className="text-cyan-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};