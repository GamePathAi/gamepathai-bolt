import React, { useState } from 'react';
import { Network, Share2, Lock, Server } from 'lucide-react';

export const NetworkOptimizer: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<number | null>(2);
  
  const routes = [
    { id: 1, name: 'Default Route', ping: 42, jitter: 8, packetLoss: 1.2, quality: 'Poor' },
    { id: 2, name: 'AI Optimized', ping: 24, jitter: 3, packetLoss: 0.2, quality: 'Excellent' },
    { id: 3, name: 'Stability Focus', ping: 31, jitter: 2, packetLoss: 0.1, quality: 'Good' },
    { id: 4, name: 'Custom Route', ping: 28, jitter: 4, packetLoss: 0.4, quality: 'Good', isPro: true },
  ];

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
            <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-medium transition-colors duration-150">
              Refresh Routes
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
        
        <div className="relative w-full h-64 sm:h-80 bg-gray-900 rounded-lg overflow-hidden">
          {/* Simulated network map (would be a real map in a production app) */}
          <div className="absolute inset-0 opacity-20 bg-map"></div>
          
          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500">
            {/* Server connections */}
            <path d="M400,250 L200,150" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
            <path d="M400,250 L600,150" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
            <path d="M400,250 L300,350" stroke="rgba(34, 211, 238, 0.8)" strokeWidth="3" />
            <path d="M400,250 L500,350" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
            <path d="M400,250 L250,200" stroke="rgba(34, 211, 238, 0.7)" strokeWidth="2" />
            <path d="M400,250 L550,200" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
            
            {/* Animated pulse along optimal path */}
            <circle cx="400" cy="250" r="3" fill="#0ff">
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="350" cy="300" r="3" fill="#0ff">
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" begin="0.2s" />
            </circle>
            <circle cx="300" cy="350" r="3" fill="#0ff">
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" begin="0.4s" />
            </circle>
          </svg>
          
          {/* Server nodes */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Server size={24} className="text-white" />
          </div>
          
          <div className="absolute left-1/4 top-[30%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
            <Server size={18} className="text-gray-400" />
          </div>
          
          <div className="absolute left-3/4 top-[30%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
            <Server size={18} className="text-gray-400" />
          </div>
          
          <div className="absolute left-[3/8] top-[70%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cyan-500/80 flex items-center justify-center border-2 border-cyan-400 shadow-lg shadow-cyan-500/30">
            <Server size={18} className="text-white" />
          </div>
          
          <div className="absolute left-[5/8] top-[70%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
            <Server size={18} className="text-gray-400" />
          </div>
          
          <div className="absolute right-4 bottom-4 flex items-center text-xs text-gray-400">
            <div className="flex items-center mr-3">
              <div className="w-3 h-1 bg-cyan-500 rounded-full mr-1"></div>
              <span>Optimal Route</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-1 bg-gray-500 rounded-full mr-1"></div>
              <span>Alternative</span>
            </div>
          </div>
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
                onClick={() => !route.isPro && setSelectedRoute(route.id)}
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
                      {route.id === 2 ? (
                        <Share2 className={selectedRoute === route.id ? 'text-cyan-400' : 'text-gray-400'} size={20} />
                      ) : (
                        <Network className={selectedRoute === route.id ? 'text-cyan-400' : 'text-gray-400'} size={20} />
                      )}
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
                    <div className="text-lg font-bold text-white">{route.ping} ms</div>
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
            <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-medium transition-colors duration-150">
              Apply Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};