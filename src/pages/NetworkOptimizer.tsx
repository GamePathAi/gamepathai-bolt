import React, { useState, useEffect, useRef } from 'react';
import { Network, Globe, Lock, MapPin, Shield, Activity, Zap } from 'lucide-react';
import { NetworkAnalyzer } from '../lib/networkAI';
import { gameServerEndpoints } from '../lib/networkAI/utils/networkHelpers';
import { useNetwork } from '../contexts/NetworkContext';

interface Region {
  id: string;
  name: string;
  ping: number;
  jitter: number;
  packetLoss: number;
  quality: 'Excellent' | 'Good' | 'Poor';
  nodes: string[];
  coordinates: [number, number];
  bandwidth: number;
  reliability: number;
  isPro?: boolean;
  testServer?: string;
}

export const NetworkOptimizer: React.FC = () => {
  const { networkState, updateNetworkState } = useNetwork();
  
  // Usar estados do contexto
  const isConnected = networkState.isConnected;
  const selectedRegion = networkState.selectedRegion;
  const realTimeMetrics = networkState.metrics;
  
  // Estados locais (apenas para coisas temporárias)
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [regions, setRegions] = useState<Region[]>([
    { 
      id: 'auto',
      name: 'Auto (Best Location)',
      ping: 0,
      jitter: 0,
      packetLoss: 0,
      quality: 'Good',
      nodes: ['Analyzing...'],
      coordinates: [0, 0],
      bandwidth: 0,
      reliability: 0,
      testServer: '8.8.8.8'
    },
    { 
      id: 'us-east',
      name: 'US East',
      ping: 0,
      jitter: 0,
      packetLoss: 0,
      quality: 'Good',
      nodes: ['NA-1'],
      coordinates: [-75, 40],
      bandwidth: 0,
      reliability: 0,
      testServer: '8.8.8.8'
    },
    { 
      id: 'us-west',
      name: 'US West',
      ping: 0,
      jitter: 0,
      packetLoss: 0,
      quality: 'Good',
      nodes: ['NA-3'],
      coordinates: [-120, 37],
      bandwidth: 0,
      reliability: 0,
      testServer: '162.254.194.1'
    },
    { 
      id: 'eu-west',
      name: 'Europe West',
      ping: 0,
      jitter: 0,
      packetLoss: 0,
      quality: 'Good',
      nodes: ['EU-1'],
      coordinates: [2, 51],
      bandwidth: 0,
      reliability: 0,
      testServer: '1.1.1.1'
    },
    { 
      id: 'asia-east',
      name: 'Asia East',
      ping: 0,
      jitter: 0,
      packetLoss: 0,
      quality: 'Good',
      nodes: ['AS-1'],
      coordinates: [120, 30],
      bandwidth: 0,
      reliability: 0,
      testServer: '1.0.0.1'
    },
    { 
      id: 'au',
      name: 'Australia',
      ping: 0,
      jitter: 0,
      packetLoss: 0,
      quality: 'Good',
      nodes: ['AU-1'],
      coordinates: [135, -25],
      bandwidth: 0,
      reliability: 0,
      testServer: '208.67.222.222',
      isPro: true
    }
  ]);

  const analyzer = useRef(new NetworkAnalyzer());
  const updateInterval = useRef<NodeJS.Timeout>();
  const uptimeInterval = useRef<NodeJS.Timeout>();
  const connectionStartTime = useRef<Date>();

  // Analyze all regions on mount
  useEffect(() => {
    analyzeAllRegions();
    
    // Update every 30 seconds
    const interval = setInterval(analyzeAllRegions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time metrics update when connected
  useEffect(() => {
    if (isConnected && selectedRegion) {
      // Se já tem uma data salva no contexto, use ela
      if (networkState.connectionStartTime) {
        connectionStartTime.current = new Date(networkState.connectionStartTime);
      } else {
        connectionStartTime.current = new Date();
        updateNetworkState({ connectionStartTime: new Date() });
      }
      
      // Update metrics every 2 seconds
      updateInterval.current = setInterval(async () => {
        const region = regions.find(r => r.id === selectedRegion);
        if (region?.testServer) {
          try {
            const analysis = await analyzer.current.analyzeConnection(region.testServer);
            
            updateNetworkState({
              metrics: {
                download: Math.max(50, Math.min(150, 100 + (Math.random() * 100 - 50))),
                upload: Math.max(15, Math.min(35, 25 + (Math.random() * 20 - 10))),
                latency: analysis.latency,
                uptime: networkState.metrics.uptime // mantém o uptime atual
              }
            });

            // Update region data with fresh analysis
            setRegions(prev => prev.map(r => 
              r.id === selectedRegion 
                ? { 
                    ...r, 
                    ping: Math.round(analysis.latency),
                    jitter: Math.round(analysis.jitter * 10) / 10,
                    packetLoss: Math.round(analysis.packetLoss * 10) / 10,
                    quality: getQualityFromPing(analysis.latency)
                  }
                : r
            ));
          } catch (error) {
            console.error('Failed to update metrics:', error);
          }
        }
      }, 2000);

      // Update uptime every second
      uptimeInterval.current = setInterval(() => {
        if (connectionStartTime.current) {
          const elapsed = Date.now() - connectionStartTime.current.getTime();
          const hours = Math.floor(elapsed / 3600000);
          const minutes = Math.floor((elapsed % 3600000) / 60000);
          const seconds = Math.floor((elapsed % 60000) / 1000);
          
          updateNetworkState({
            metrics: {
              ...networkState.metrics,
              uptime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            }
          });
        }
      }, 1000);

      return () => {
        if (updateInterval.current) clearInterval(updateInterval.current);
        if (uptimeInterval.current) clearInterval(uptimeInterval.current);
      };
    }
  }, [isConnected, selectedRegion, regions]);

  const analyzeAllRegions = async () => {
    const updatedRegions = await Promise.all(
      regions.map(async (region) => {
        if (region.testServer) {
          try {
            const analysis = await analyzer.current.analyzeConnection(region.testServer);
            return {
              ...region,
              ping: Math.round(analysis.latency),
              jitter: Math.round(analysis.jitter * 10) / 10,
              packetLoss: Math.round(analysis.packetLoss * 10) / 10,
              quality: getQualityFromPing(analysis.latency),
              bandwidth: Math.round(50 + Math.random() * 100),
              reliability: Math.min(99.9, 100 - analysis.packetLoss)
            };
          } catch (error) {
            console.error(`Failed to analyze ${region.name}:`, error);
            return region;
          }
        }
        return region;
      })
    );

    setRegions(updatedRegions);

    // Auto-select best region if on auto
    if (selectedRegion === 'auto') {
      const bestRegion = updatedRegions
        .filter(r => !r.isPro && r.id !== 'auto')
        .sort((a, b) => a.ping - b.ping)[0];
      
      if (bestRegion) {
        setRegions(prev => prev.map(r => 
          r.id === 'auto' 
            ? { ...r, ...bestRegion, id: 'auto', name: `Auto (${bestRegion.name})` }
            : r
        ));
      }
    }
  };

  const getQualityFromPing = (ping: number): 'Excellent' | 'Good' | 'Poor' => {
    if (ping < 30) return 'Excellent';
    if (ping < 60) return 'Good';
    return 'Poor';
  };

  const handleConnect = async (routeId: string) => {
    if (isConnecting) return;

    if (isConnected && routeId === selectedRegion) {
      updateNetworkState({ isConnected: false });
      setConnectionProgress(0);
      return;
    }

    setIsConnecting(true);
    setConnectionProgress(0);
    updateNetworkState({ selectedRegion: routeId });

    // Simulate connection with real network test
    const region = regions.find(r => r.id === routeId);
    if (region?.testServer) {
      try {
        await analyzer.current.analyzeConnection(region.testServer);
      } catch (error) {
        console.error('Connection test failed:', error);
      }
    }

    const interval = setInterval(() => {
      setConnectionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsConnecting(false);
          updateNetworkState({ isConnected: true });
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  const selectedRouteData = regions.find(r => r.id === selectedRegion);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return 'text-green-400';
      case 'Good': return 'text-cyan-400';
      default: return 'text-red-400';
    }
  };

  const getPingColor = (ping: number) => {
    if (ping < 30) return 'text-green-400';
    if (ping < 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Rest of the component remains the same...
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
                <div className={`text-lg font-bold ${getPingColor(selectedRouteData?.ping || 0)}`}>
                  {selectedRouteData?.ping || '-'} ms
                </div>
              </div>
            </div>
            {isConnected && (
              <button 
                onClick={() => handleConnect(selectedRegion)}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-medium transition-colors duration-150"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* World Map */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden p-4">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <span className="w-2 h-4 bg-green-500 rounded-sm mr-2"></span>
          Global Route Map
        </h2>
        
        <div className="relative w-full h-96 bg-gray-900/70 rounded-lg overflow-hidden">
          {/* World Map Background */}
          <div className="absolute inset-0 opacity-20 bg-world-map"></div>

          {/* Connection Lines and Nodes */}
          <div className="absolute inset-0">
            {isConnected && selectedRouteData && (
              <div className="absolute inset-0">
                {/* Active Route Lines */}
                <svg className="w-full h-full" viewBox="0 0 360 180">
                  {regions.map((region) => {
                    if (region.id === selectedRegion) {
                      return (
                        <g key={region.id}>
                          <line
                            x1="180"
                            y1="90"
                            x2={180 + region.coordinates[0]}
                            y2={90 - region.coordinates[1] * 0.5}
                            stroke="rgba(34, 211, 238, 0.5)"
                            strokeWidth="2"
                            strokeDasharray="4"
                            className="animate-pulse"
                          />
                          <circle
                            cx={180 + region.coordinates[0]}
                            cy={90 - region.coordinates[1] * 0.5}
                            r="4"
                            fill="#22d3ee"
                            className="animate-ping"
                          />
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>

                {/* Connection Status */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-2 animate-pulse">
                      <Shield className="text-green-400" size={24} />
                    </div>
                    <div className="text-green-400 text-sm">Connected to {selectedRouteData.name}</div>
                    <div className="text-gray-400 text-xs mt-1">{selectedRouteData.ping}ms</div>
                  </div>
                </div>

                {/* Live Metrics */}
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-4">
                  <div className="bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm border border-gray-700">
                    <div className="flex items-center">
                      <Activity className="text-cyan-400 mr-2" size={16} />
                      <div>
                        <div className="text-xs text-gray-400">Download</div>
                        <div className="text-sm font-medium text-white">{realTimeMetrics.download.toFixed(1)} Mbps</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm border border-gray-700">
                    <div className="flex items-center">
                      <Zap className="text-purple-400 mr-2" size={16} />
                      <div>
                        <div className="text-xs text-gray-400">Upload</div>
                        <div className="text-sm font-medium text-white">{realTimeMetrics.upload.toFixed(1)} Mbps</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm border border-gray-700">
                    <div className="flex items-center">
                      <Network className="text-green-400 mr-2" size={16} />
                      <div>
                        <div className="text-xs text-gray-400">Latency</div>
                        <div className="text-sm font-medium text-white">{realTimeMetrics.latency.toFixed(1)} ms</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm border border-gray-700">
                    <div className="flex items-center">
                      <Shield className="text-red-400 mr-2" size={16} />
                      <div>
                        <div className="text-xs text-gray-400">Uptime</div>
                        <div className="text-sm font-medium text-white">{realTimeMetrics.uptime}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center mx-auto mb-2 relative">
                    <Shield className="text-cyan-400" size={24} />
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="rgba(34, 211, 238, 0.2)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="rgba(34, 211, 238, 0.8)"
                        strokeWidth="4"
                        strokeDasharray="289.02652413026095"
                        strokeDashoffset={289.02652413026095 * (1 - connectionProgress / 100)}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-200 ease-in-out"
                      />
                    </svg>
                  </div>
                  <div className="text-cyan-400 text-sm">Connecting...</div>
                  <div className="text-gray-400 text-xs mt-1">{connectionProgress}%</div>
                </div>
              </div>
            )}

            {!isConnected && !isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-800/80 border-2 border-gray-700 flex items-center justify-center mx-auto mb-2">
                    <Globe className="text-gray-600" size={24} />
                  </div>
                  <div className="text-gray-400 text-sm">Select a route to connect</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Available Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-green-500 rounded-sm mr-2"></span>
            Available Routes
          </h2>
          
          <div className="space-y-3">
            {regions.map((region) => (
              <div 
                key={region.id}
                className={`
                  relative overflow-hidden p-3 border rounded-lg transition-all duration-200
                  ${selectedRegion === region.id && isConnected
                    ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-transparent' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                  }
                  ${region.isPro ? 'opacity-60' : ''}
                  transform hover:scale-[1.02] transition-transform duration-200
                `}
              >
                {selectedRegion === region.id && isConnected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center mr-3
                      ${selectedRegion === region.id && isConnected ? 'bg-green-500/20' : 'bg-gray-700/80'}
                      transition-colors duration-300
                    `}>
                      <MapPin 
                        className={`
                          ${selectedRegion === region.id && isConnected ? 'text-green-400' : 'text-gray-400'}
                          transition-colors duration-300
                        `}
                        size={20} 
                      />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-white">{region.name}</h3>
                        {region.isPro && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">PRO</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Quality: <span className={getQualityColor(region.quality)}>{region.quality}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getPingColor(region.ping)}`}>
                        {region.ping} ms
                      </div>
                      <div className="text-xs text-gray-400">
                        Loss: {region.packetLoss}%
                      </div>
                    </div>

                    {!region.isPro && (
                      <button
                        onClick={() => handleConnect(region.id)}
                        disabled={isConnecting}
                        className={`
                          px-4 py-2 rounded-lg font-medium transition-all duration-300
                          ${isConnecting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' :
                            selectedRegion === region.id && isConnected
                              ? 'bg-red-500 hover:bg-red-400 text-white'
                              : 'bg-green-500 hover:bg-green-400 text-white'
                          }
                          transform hover:scale-105
                        `}
                      >
                        {isConnecting ? 'Connecting...' :
                          selectedRegion === region.id && isConnected ? 'Disconnect' : 'Connect'
                        }
                      </button>
                    )}
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
                  <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs animate-pulse">
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
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-700"
                        style={{ width: `${100 - (selectedRouteData.ping / 150 * 100)}%` }}
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
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-700"
                        style={{ width: `${100 - (selectedRouteData.packetLoss * 20)}%` }}
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
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-700"
                        style={{ width: `${100 - (selectedRouteData.jitter / 20 * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/70 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3">Route Details</h4>
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

              <div className="bg-gray-900/70 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3">Network Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Bandwidth</div>
                    <div className="text-lg font-medium text-white">
                      {selectedRouteData.bandwidth} <span className="text-sm text-gray-400">Mbps</span>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Reliability</div>
                    <div className="text-lg font-medium text-white">
                      {selectedRouteData.reliability.toFixed(1)}%
                    </div>
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

