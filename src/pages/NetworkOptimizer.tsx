import React, { useState, useEffect } from 'react';
import { Network, Share2, Lock, Server, MapPin } from 'lucide-react';

export const NetworkOptimizer: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(2);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  
  const routes = [
    { id: 1, name: 'Default Route', ping: 42, jitter: 8, packetLoss: 1.2, quality: 'Poor', nodes: ['NA-1', 'EU-1', 'AS-1'] },
    { id: 2, name: 'AI Optimized', ping: 24, jitter: 3, packetLoss: 0.2, quality: 'Excellent', nodes: ['NA-2', 'EU-2', 'AS-2'] },
    { id: 3, name: 'Stability Focus', ping: 31, jitter: 2, packetLoss: 0.1, quality: 'Good', nodes: ['NA-3', 'EU-3'] },
    { id: 4, name: 'Custom Route', ping: 28, jitter: 4, packetLoss: 0.4, quality: 'Good', isPro: true, nodes: ['NA-4', 'EU-4'] },
  ];

  // Network nodes for the map
  const nodes = {
    'NA-1': { x: 200, y: 150, label: 'North America 1' },
    'NA-2': { x: 180, y: 180, label: 'North America 2' },
    'NA-3': { x: 220, y: 160, label: 'North America 3' },
    'NA-4': { x: 190, y: 170, label: 'North America 4' },
    'EU-1': { x: 400, y: 120, label: 'Europe 1' },
    'EU-2': { x: 420, y: 140, label: 'Europe 2' },
    'EU-3': { x: 380, y: 130, label: 'Europe 3' },
    'EU-4': { x: 410, y: 110, label: 'Europe 4' },
    'AS-1': { x: 600, y: 180, label: 'Asia 1' },
    'AS-2': { x: 620, y: 160, label: 'Asia 2' },
  };

  useEffect(() => {
    // Update active nodes when route changes
    const selectedRouteData = routes.find(r => r.id === selectedRoute);
    if (selectedRouteData) {
      setActiveNodes(selectedRouteData.nodes);
    }
  }, [selectedRoute]);

  const handleConnect = () => {
    if (isConnected) {
      setIsConnected(false);
      setConnectionProgress(0);
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
        return prev + 2;
      });
    }, 50);
  };

  const handleRouteSelect = (routeId: number) => {
    if (!routes.find(r => r.id === routeId)?.isPro) {
      setSelectedRoute(routeId);
    }
  };

  const renderNetworkMap = () => {
    const selectedRouteData = routes.find(r => r.id === selectedRoute);
    const routeNodes = selectedRouteData?.nodes || [];

    return (
      <svg className="w-full h-full" viewBox="0 0 800 400">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connection lines */}
        {Object.entries(nodes).map(([nodeId, node]) => {
          if (routeNodes.includes(nodeId)) {
            const nextNodeIndex = routeNodes.indexOf(nodeId) + 1;
            if (nextNodeIndex < routeNodes.length) {
              const nextNode = nodes[routeNodes[nextNodeIndex]];
              return (
                <g key={`line-${nodeId}`}>
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={nextNode.x}
                    y2={nextNode.y}
                    stroke={isConnected ? "rgba(34, 211, 238, 0.8)" : "rgba(34, 211, 238, 0.3)"}
                    strokeWidth="2"
                  />
                  {isConnected && (
                    <circle className="animate-ping" r="4" fill="rgba(34, 211, 238, 0.5)">
                      <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={`M${node.x},${node.y} L${nextNode.x},${nextNode.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            }
          }
          return null;
        })}

        {/* Nodes */}
        {Object.entries(nodes).map(([nodeId, node]) => {
          const isActive = routeNodes.includes(nodeId);
          const isEndpoint = routeNodes[0] === nodeId || routeNodes[routeNodes.length - 1] === nodeId;
          
          return (
            <g key={nodeId} className="transition-all duration-300">
              <circle
                cx={node.x}
                cy={node.y}
                r={isEndpoint ? 8 : 6}
                className={`
                  ${isActive 
                    ? isConnected
                      ? 'fill-cyan-500 stroke-cyan-400'
                      : 'fill-gray-700 stroke-gray-600'
                    : 'fill-gray-800 stroke-gray-700'
                  }
                  transition-all duration-300
                `}
                strokeWidth="2"
              />
              {isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isEndpoint ? 12 : 10}
                  className={`
                    ${isConnected ? 'stroke-cyan-500/50' : 'stroke-gray-600/50'}
                    fill-transparent
                    transition-all duration-300
                  `}
                  strokeWidth="1"
                />
              )}
              <title>{node.label}</title>
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(20, 360)">
          <circle cx="10" cy="0" r="4" className="fill-cyan-500" />
          <text x="20" y="4" className="text-xs fill-gray-400">Active Node</text>
          <circle cx="100" cy="0" r="4" className="fill-gray-800 stroke-gray-700" strokeWidth="2" />
          <text x="110" y="4" className="text-xs fill-gray-400">Inactive Node</text>
        </g>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden p-6">
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
                <div className="text-lg font-bold text-white">24ms</div>
              </div>
            </div>
            <button 
              onClick={handleConnect}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors duration-150
                ${isConnected 
                  ? 'bg-red-500 hover:bg-red-400 text-white' 
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                }
              `}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      </div>

      {/* Network Map */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden p-4">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <span className="w-2 h-4 bg-cyan-500 rounded-sm mr-2"></span>
          Global Route Map
        </h2>
        
        <div className="relative w-full h-96 bg-gray-900/70 rounded-lg overflow-hidden">
          {renderNetworkMap()}
          
          {/* Connection Status Overlay */}
          {connectionProgress > 0 && connectionProgress < 100 && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(6, 182, 212, 0.2)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgb(6, 182, 212)"
                      strokeWidth="8"
                      strokeDasharray="283"
                      strokeDashoffset={283 * (1 - connectionProgress / 100)}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-cyan-400">
                    {connectionProgress}%
                  </div>
                </div>
                <p className="text-cyan-400 font-medium">Establishing Connection...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Routes Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-cyan-500 rounded-sm mr-2"></span>
            Available Routes
          </h2>
          
          <div className="space-y-3">
            {routes.map((route) => (
              <div 
                key={route.id}
                onClick={() => handleRouteSelect(route.id)}
                className={`
                  relative overflow-hidden p-3 border rounded-lg cursor-pointer transition-all duration-200
                  ${selectedRoute === route.id 
                    ? 'border-cyan-500 bg-gradient-to-r from-cyan-500/10 to-transparent' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                  }
                  ${route.isPro ? 'opacity-60' : ''}
                `}
              >
                {selectedRoute === route.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center mr-3
                      ${selectedRoute === route.id ? 'bg-cyan-500/20' : 'bg-gray-700/80'}
                    `}>
                      <MapPin className={selectedRoute === route.id ? 'text-cyan-400' : 'text-gray-400'} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-white">{route.name}</h3>
                        {route.isPro && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">PRO</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Quality: <span className={
                          route.quality === 'Excellent' 
                            ? 'text-green-400' 
                            : route.quality === 'Good' 
                              ? 'text-cyan-400' 
                              : 'text-red-400'
                        }>{route.quality}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      route.ping < 30 
                        ? 'text-green-400' 
                        : route.ping < 50 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                    }`}>{route.ping} ms</div>
                    <div className="text-xs text-gray-400">
                      Loss: {route.packetLoss}%
                    </div>
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
        
        {/* Route Details */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-cyan-500 rounded-sm mr-2"></span>
            Route Performance
          </h2>
          
          <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">AI Optimized Route</h3>
              <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                Active
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Ping</span>
                  <span>24ms (58% improvement)</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 w-[58%]"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Stability</span>
                  <span>97%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400 w-[97%]"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Packet Loss</span>
                  <span>0.2%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400 w-[99%]"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="text-sm text-white font-medium mb-2">Route Details</h4>
              <div className="text-xs text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span>Optimized Servers</span>
                  <span>9 hops</span>
                </div>
                <div className="flex justify-between">
                  <span>Route Algorithm</span>
                  <span>Neural Pathfinder v2.1</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated</span>
                  <span>2 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleConnect}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors duration-150
                ${isConnected 
                  ? 'bg-red-500 hover:bg-red-400 text-white' 
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                }
              `}
            >
              {isConnected ? 'Disconnect' : 'Apply Route'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};