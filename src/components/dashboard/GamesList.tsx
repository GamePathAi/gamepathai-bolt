import React from 'react';
import { Gamepad2, ChevronRight } from 'lucide-react';

export const GamesList: React.FC = () => {
  const games = [
    { 
      id: 1, 
      name: 'Cyberpunk 2077', 
      logo: 'https://images.pexels.com/photos/2007647/pexels-photo-2007647.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: true, 
      platform: 'Steam'
    },
    { 
      id: 2, 
      name: 'League of Legends', 
      logo: 'https://images.pexels.com/photos/7915578/pexels-photo-7915578.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: true, 
      platform: 'Riot'
    },
    { 
      id: 3, 
      name: 'Fortnite', 
      logo: 'https://images.pexels.com/photos/7915426/pexels-photo-7915426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: false, 
      platform: 'Epic'
    },
    { 
      id: 4, 
      name: 'Counter-Strike 2', 
      logo: 'https://images.pexels.com/photos/7915449/pexels-photo-7915449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: true, 
      platform: 'Steam'
    },
  ];

  return (
    <div className="space-y-3">
      {games.map((game) => (
        <div 
          key={game.id} 
          className="flex items-center p-2 rounded-lg hover:bg-gray-700/30 transition-colors duration-150 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded bg-gray-700 overflow-hidden mr-3 flex-shrink-0">
            {game.logo ? (
              <img 
                src={game.logo} 
                alt={game.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gamepad2 size={20} className="text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{game.name}</h3>
            <div className="flex items-center">
              <span className="text-xs text-gray-400">{game.platform}</span>
              {game.optimized && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-300 rounded-sm">
                  Optimized
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
      <button className="w-full text-center py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
        View All Games
      </button>
    </div>
  );
};