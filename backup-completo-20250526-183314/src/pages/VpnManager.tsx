import React, { useState } from 'react';
import { Shield, Globe, Lock, MapPin } from 'lucide-react';

export const VpnManager: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('auto');
  const [connectionProgress, setConnectionProgress] = useState(0);
  
  const regions = [
    { id: 'auto', name: 'Auto (Best Location)', ping: 24 },
    { id: 'us-east', name: 'US East', ping: 86 },
    { id: 'us-west', name: 'US West', ping: 110 },
    { id: 'eu-west', name: 'Europe West', ping: 145 },
    { id: 'asia-east', name: 'Asia East', ping: 190 },
    { id: 'au', name: 'Australia', ping: 250, isPro: true },
  ];
  
  const handleConnect = () => {
    if (isConnected) {
      setIsConnected(false);
      return;
    }
    
    setConnectionProgress(0);
    
    const interval = setInterval(() => {
      setConnectionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsConnected(true);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">VPN Manager</h1>
            <p className="text-gray-400 mt-1">
              Secure gaming connection with optimized routing
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gray-700/50 rounded-lg px-4 py-2 flex items-center">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <div>
                <div className="text-xs text-gray-400">Status</div>
                <div className="text-sm font-medium text-white">{isConnected ? 'Connected' : 'Disconnected'}</div>
              </div>
            </div>
            <button 
              onClick={handleConnect}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors duration-150
                ${isConnected 
                  ? 'bg-red-500 hover:bg-red-400 text-white' 
                  : 'bg-green-500 hover:bg-green-400 text-white'
                }
              `}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
      
      {/* VPN Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-green-500 rounded-sm mr-2"></span>
            Connection Map
          </h2>
          
          <div className="relative w-full h-64 sm:h-96 bg-gray-900 rounded-lg overflow-hidden">
            {/* Simulated world map (would be a real map in a production app) */}
            <div className="absolute inset-0 opacity-20 bg-world-map"></div>
            
            {/* Connection status */}
            {isConnected ? (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 border-2 border-green-500 animated-pulse">
                  <Shield className="text-green-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">VPN Connected</h3>
                <p className="text-green-400 text-sm">Your connection is secure</p>
                
                <div className="absolute bottom-4 left-4 bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Current Server</div>
                  <div className="flex items-center">
                    <MapPin size={16} className="text-green-400 mr-2" />
                    <span className="text-sm font-medium text-white">{regions.find(r => r.id === selectedRegion)?.name}</span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="text-xs text-gray-400 mr-2">Ping:</div>
                    <div className="text-xs font-medium text-green-400">{regions.find(r => r.id === selectedRegion)?.ping} ms</div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">IP Address</div>
                  <div className="flex items-center">
                    <Lock size={16} className="text-green-400 mr-2" />
                    <span className="text-sm font-medium text-white">192.168.xx.xx</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Hidden from tracking
                  </div>
                </div>
              </div>
            ) : connectionProgress > 0 ? (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4 border-2 border-gray-700 relative">
                  <Shield className="text-gray-600" size={32} />
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="rgba(74, 222, 128, 0.2)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="rgba(74, 222, 128, 0.8)"
                      strokeWidth="8"
                      strokeDasharray="289.02652413026095"
                      strokeDashoffset={289.02652413026095 * (1 - connectionProgress / 100)}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Connecting...</h3>
                <p className="text-gray-400 text-sm">{connectionProgress}%</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4 border-2 border-gray-700">
                  <Shield className="text-gray-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">VPN Disconnected</h3>
                <p className="text-red-400 text-sm">Your connection is not secured</p>
                
                <div className="absolute bottom-4 left-4 bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Selected Server</div>
                  <div className="flex items-center">
                    <MapPin size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-white">{regions.find(r => r.id === selectedRegion)?.name}</span>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">IP Address</div>
                  <div className="flex items-center">
                    <Globe size={16} className="text-yellow-400 mr-2" />
                    <span className="text-sm font-medium text-white">Your real IP</span>
                  </div>
                  <div className="mt-2 text-xs text-yellow-400">
                    Potentially exposed
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Connection stats */}
          {isConnected && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-900/70 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Download</div>
                <div className="text-lg font-bold text-white">86.4 <span className="text-sm text-gray-400">Mbps</span></div>
              </div>
              <div className="bg-gray-900/70 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Upload</div>
                <div className="text-lg font-bold text-white">24.2 <span className="text-sm text-gray-400">Mbps</span></div>
              </div>
              <div className="bg-gray-900/70 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Latency</div>
                <div className="text-lg font-bold text-white">24 <span className="text-sm text-gray-400">ms</span></div>
              </div>
              <div className="bg-gray-900/70 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Uptime</div>
                <div className="text-lg font-bold text-white">24:12</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Location Selector */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-green-500 rounded-sm mr-2"></span>
            Server Locations
          </h2>
          
          <div className="space-y-3">
            {regions.map((region) => (
              <div 
                key={region.id}
                onClick={() => !region.isPro && setSelectedRegion(region.id)}
                className={`
                  relative overflow-hidden p-3 border rounded-lg cursor-pointer transition-all duration-200
                  ${selectedRegion === region.id 
                    ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-transparent' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                  }
                  ${region.isPro ? 'opacity-60' : ''}
                `}
              >
                {selectedRegion === region.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center mr-3
                      ${selectedRegion === region.id ? 'bg-green-500/20' : 'bg-gray-700/80'}
                    `}>
                      <MapPin className={selectedRegion === region.id ? 'text-green-400' : 'text-gray-400'} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-white">{region.name}</h3>
                        {region.isPro && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">PRO</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      region.ping < 50 
                        ? 'text-green-400' 
                        : region.ping < 100 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                    }`}>{region.ping} ms</div>
                  </div>
                  
                  {region.isPro && (
                    <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center">
                      <div className="flex items-center p-2 rounded-lg bg-purple-500/20 border border-purple-500/40">
                        <Lock size={14} className="text-purple-400 mr-1" />
                        <span className="text-xs text-purple-300">Pro Feature</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 bg-gray-900/70 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">VPN Features</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="text-sm text-white">IP Masking</div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="text-sm text-white">DDoS Protection</div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="text-sm text-white">AES-256 Encryption</div>
              </div>
              
              <div className="flex items-center opacity-60">
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                  <Lock size={16} className="text-purple-400" />
                </div>
                <div className="text-sm text-white flex items-center">
                  Multi-Hop Routing
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-sm">
                    PRO
                  </span>
                </div>
              </div>
              
              <div className="flex items-center opacity-60">
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                  <Lock size={16} className="text-purple-400" />
                </div>
                <div className="text-sm text-white flex items-center">
                  Dedicated IP
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-sm">
                    PRO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};