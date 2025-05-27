import React from 'react';
import { Gamepad2, ChevronRight } from 'lucide-react';

export const GamesList: React.FC = () => {
  const games = [
    { 
      id: 1, 
      name: 'Cyberpunk 2077', 
      logo: 'https://images.pexels.com/photos/2007647/pexels-photo-2007647.jpeg',
      optimized: true, 
      platform: 'Steam'
    },
    { 
      id: 2, 
      name: 'League of Legends', 
      logo: null,
      optimized: true, 
      platform: 'Riot'
    },
    { 
      id: 3, 
      name: 'Fortnite', 
      logo: null,
      optimized: false, 
      platform: 'Epic'
    },
    { 
      id: 4, 
      name: 'Counter-Strike 2', 
      logo: null,
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
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                  e.currentTarget.replaceWith(
                    Object.assign(document.createElement('div'), {
                      className: 'flex items-center justify-center w-full h-full',
                      innerHTML: '<div class="text-gray-400"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11h4a4 4 0 0 1 4 4v4H6z M14 11h4"/><rect width="20" height="14" x="2" y="3" rx="2"/></svg></div>'
                    })
                  );
                }}
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