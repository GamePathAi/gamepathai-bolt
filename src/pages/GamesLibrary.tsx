import React from 'react';
import { GameList } from '../components/GameLauncher/GameList';

export const GamesLibrary: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-red-500/20 rounded-lg overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Games Library</h1>
            <p className="text-gray-400 mt-1">
              Detected games ready for optimization
            </p>
          </div>
        </div>
      </div>

      {/* Games List */}
      <GameList />
    </div>
  );
};