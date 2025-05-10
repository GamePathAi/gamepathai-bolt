import React, { useState, useEffect } from 'react';
import { Network, Globe, Lock, MapPin, Shield } from 'lucide-react';

interface Route {
  id: string;
  name: string;
  ping: number;
  jitter: number;
  packetLoss: number;
  quality: 'Excellent' | 'Good' | 'Poor';
  nodes: string[];
  isPro?: boolean;
}

export const NetworkOptimizer: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('ai-optimized');
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentPing, setCurrentPing] = useState(0);
  
  const routes: Route[] = [
    { 
      id: 'default',
      name: 'Default Route', 
      ping: 42,
      jitter: 8,
      packetLoss: 1.2,
      quality: 'Poor',
      nodes: ['NA-1', 'EU-1', 'AS-1']
    },
    { 
      id: 'ai-optimized',
      name: 'AI Optimized',
      ping: 24,
      jitter: 3,
      packetLoss: 0.2,
      quality: 'Excellent',
      nodes: ['NA-2', 'EU-2', 'AS-2']
    },
    { 
      id: 'stability',
      name: 'Stability Focus',
      ping: 31,
      jitter: 2,
      packetLoss: 0.1,
      quality: 'Good',
      nodes: ['NA-3', 'EU-3']
    },
    { 
      id: 'custom',
      name: 'Custom Route',
      ping: 28,
      jitter: 4,
      packetLoss: 0.4,
      quality: 'Good',
      isPro: true,
      nodes: ['NA-4', 'EU-4']
    }
  ];

  const selectedRouteData = routes.find(r => r.id === selectedRoute);

  useEffect(() => {
    if (isConnected) {
      setCurrentPing(selectedRouteData?.ping || 0);
    }
  }, [isConnected, selectedRoute]);

  const handleConnect = async (routeId: string) => {
    if (isConnecting) return;

    if (isConnected && routeId === selectedRoute) {
      // Disconnect current route
      setIsConnected(false);
      setCurrentPing(0);
      setConnectionProgress(0);
      return;
    }

    setIsConnecting(true);
    setConnectionProgress(0);
    setSelectedRoute(routeId);

    // Simulate connection process
    const interval = setInterval(() => {
      setConnectionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsConnecting(false);
          setIsConnected(true);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent':
        return 'text-green-400';
      case 'Good':
        return 'text-cyan-400';
      default:
        return 'text-red-400';
    }
  };

  const getPingColor = (ping: number) => {
    if (ping < 30) return 'text-green-400';
    if (ping < 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Network Optimizer</h1>
            <p className="text-gray-400 mt-1">
              AI-powered routing to reduce latency and packet loss
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gray-700/50 rounded-lg px-4 py-2 flex items-center">
              <Network className="text-cyan-400 mr-2" size={18} />
              <div>
                <div className="text-xs text-gray-400">Current Ping</div>
                <div className={`text-lg font-bold ${getPingColor(currentPing)}`}>
                  {currentPing > 0 ? `${currentPing}ms` : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Map */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden p-4">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <span className="w-2 h-4 bg-green-500 rounded-sm mr-2"></span>
          Global Route Map
        </h2>
        
        <div className="relative w-full h-96 bg-gray-900/70 rounded-lg overflow-hidden">
          {/* Map visualization would go here */}
          {isConnected ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 border-2 border-green-500 animated-pulse">
                <Shield className="text-green-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">Route Active</h3>
              <p className="text-green-400 text-sm">Connection optimized</p>
            </div>
          ) : isConnecting ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4 relative">
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
              <h3 className="text-lg font-bold text-white">No Active Route</h3>
              <p className="text-gray-400 text-sm">Select a route to connect</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Routes */}
        <div className="lg:col-span-2 bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-green-500 rounded-sm mr-2"></span>
            Available Routes
          </h2>
          
          <div className="space-y-3">
            {routes.map((route) => (
              <div 
                key={route.id}
                className={`
                  relative overflow-hidden p-3 border rounded-lg transition-all duration-200
                  ${selectedRoute === route.id && isConnected
                    ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-transparent' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                  }
                  ${route.isPro ? 'opacity-60' : ''}
                `}
              >
                {selectedRoute === route.id && isConnected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center mr-3
                      ${selectedRoute === route.id && isConnected ? 'bg-green-500/20' : 'bg-gray-700/80'}
                    `}>
                      <MapPin 
                        className={selectedRoute === route.id && isConnected ? 'text-green-400' : 'text-gray-400'} 
                        size={20} 
                      />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-white">{route.name}</h3>
                        {route.isPro && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">PRO</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Quality: <span className={getQualityColor(route.quality)}>{route.quality}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getPingColor(route.ping)}`}>
                        {route.ping} ms
                      </div>
                      <div className="text-xs text-gray-400">
                        Loss: {route.packetLoss}%
                      </div>
                    </div>

                    {!route.isPro && (
                      <button
                        onClick={() => handleConnect(route.id)}
                        disabled={isConnecting}
                        className={`
                          px-4 py-2 rounded-lg font-medium transition-colors duration-150
                          ${isConnecting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' :
                            selectedRoute === route.id && isConnected
                              ? 'bg-red-500 hover:bg-red-400 text-white'
                              : 'bg-green-500 hover:bg-green-400 text-white'
                          }
                        `}
                      >
                        {isConnecting ? 'Connecting...' :
                          selectedRoute === route.id && isConnected ? 'Disconnect' : 'Connect'
                        }
                      </button>
                    )}
                  </div>
                  
                  {route.isPro && (
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
        </div>
        
        {/* Route Performance */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-green-500 rounded-sm mr-2"></span>
            Route Performance
          </h2>
          
          {selectedRouteData && isConnected ? (
            <div className="space-y-6">
              <div className="bg-gray-900/70 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">{selectedRouteData.name}</h3>
                  <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                    Active
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Ping</span>
                      <span>{selectedRouteData.ping}ms</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400"
                        style={{ width: `${100 - (selectedRouteData.ping / 100 * 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Packet Loss</span>
                      <span>{selectedRouteData.packetLoss}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400"
                        style={{ width: `${100 - (selectedRouteData.packetLoss * 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Jitter</span>
                      <span>{selectedRouteData.jitter}ms</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400"
                        style={{ width: `${100 - (selectedRouteData.jitter / 20 * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/70 rounded-lg p-4">
                <h4 className="text-sm text-white font-medium mb-3">Route Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nodes</span>
                    <span className="text-white">{selectedRouteData.nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quality</span>
                    <span className={getQualityColor(selectedRouteData.quality)}>
                      {selectedRouteData.quality}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="text-green-400">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/70 rounded-lg p-4 text-center">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                Select and connect to a route to view performance metrics
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};