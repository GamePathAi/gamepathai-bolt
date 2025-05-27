import React from 'react';
import { SystemDashboard } from '../components/SystemDashboard';
import { OptimizeButton } from '../components/dashboard/OptimizeButton';
import { NetworkMetricsGrid } from '../components/dashboard/NetworkMetricsGrid';
import { GamesList } from '../components/dashboard/GamesList';
import { PerformanceMetrics } from '../components/analysis/PerformanceMetrics';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="md:col-span-4 space-y-6">
        {/* Hero Section with Optimize Button */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden relative h-48">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-cyan-900/20"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-cyan-500"></div>
          <div className="h-full flex flex-col items-center justify-center p-6 relative z-10">
            <h2 className="text-2xl font-bold text-center mb-2 text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                GamePath AI
              </span>
              <span> is ready to optimize</span>
            </h2>
            <p className="text-gray-400 text-center mb-4 max-w-md">
              Boost your gaming performance with our AI-powered optimization system
            </p>
            <OptimizeButton />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-purple-500/10 to-transparent"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-cyan-500/10 blur-xl"></div>
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-purple-500/10 blur-xl"></div>
        </div>

        {/* System Dashboard */}
        <SystemDashboard refreshRate={2000} showHistory={true} showAlerts={true} />

        {/* Performance Metrics */}
        <PerformanceMetrics />

        {/* Network Metrics Grid */}
        <NetworkMetricsGrid />
      </div>

      {/* Sidebar section */}
      <div className="md:col-span-2 space-y-6">
        {/* Detected Games */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-cyan-500 rounded-sm mr-2"></span>
            Detected Games
          </h2>
          <GamesList />
        </div>
      </div>
    </div>
  );
};