import React, { useState } from 'react';
import { Gamepad2, Search, Filter, ChevronDown } from 'lucide-react';

export const GamesLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  
  const games = [
    { 
      id: 1, 
      name: 'Cyberpunk 2077', 
      logo: 'https://images.pexels.com/photos/2007647/pexels-photo-2007647.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: true, 
      platform: 'Steam',
      lastPlayed: '2 hours ago',
      size: '78 GB',
    },
    { 
      id: 2, 
      name: 'League of Legends', 
      logo: 'https://images.pexels.com/photos/7915578/pexels-photo-7915578.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: true, 
      platform: 'Riot',
      lastPlayed: '1 day ago',
      size: '14 GB',
    },
    { 
      id: 3, 
      name: 'Fortnite', 
      logo: 'https://images.pexels.com/photos/7915426/pexels-photo-7915426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: false, 
      platform: 'Epic',
      lastPlayed: '3 days ago',
      size: '26 GB',
    },
    { 
      id: 4, 
      name: 'Counter-Strike 2', 
      logo: 'https://images.pexels.com/photos/7915449/pexels-photo-7915449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: true, 
      platform: 'Steam',
      lastPlayed: '5 hours ago',
      size: '32 GB',
    },
    { 
      id: 5, 
      name: 'Overwatch 2', 
      logo: 'https://images.pexels.com/photos/596750/pexels-photo-596750.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: true, 
      platform: 'Battle.net',
      lastPlayed: '2 days ago',
      size: '48 GB',
    },
    { 
      id: 6, 
      name: 'Apex Legends', 
      logo: 'https://images.pexels.com/photos/1174746/pexels-photo-1174746.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      optimized: false, 
      platform: 'Steam',
      lastPlayed: '1 week ago',
      size: '56 GB',
    },
  ];
  
  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter ? game.platform === platformFilter : true;
    return matchesSearch && matchesPlatform;
  });
  
  const platforms = Array.from(new Set(games.map(game => game.platform)));

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
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-medium transition-colors duration-150">
              Scan for Games
            </button>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-red-500/20 rounded-lg overflow-hidden p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-red-500 focus:outline-none focus:ring-0 text-gray-200 placeholder-gray-500"
            />
          </div>
          
          <div className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                value={platformFilter || ''}
                onChange={(e) => setPlatformFilter(e.target.value || null)}
                className="appearance-none block w-full pl-10 pr-10 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-red-500 focus:outline-none focus:ring-0 text-gray-200"
              >
                <option value="">All Platforms</option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => (
          <div 
            key={game.id}
            className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 hover:border-red-500/40 rounded-lg overflow-hidden transition-all duration-200 group"
          >
            <div className="h-40 relative overflow-hidden">
              {game.logo ? (
                <img 
                  src={game.logo} 
                  alt={game.name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Gamepad2 size={48} className="text-gray-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-bold text-white">{game.name}</h3>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-400">{game.platform}</span>
                  <span className="mx-2 text-gray-600">•</span>
                  <span className="text-xs text-gray-400">{game.size}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-400">
                  Last played: {game.lastPlayed}
                </div>
                {game.optimized ? (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                    Optimized
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                    Not Optimized
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button className={`
                  flex-1 py-2 rounded-md text-sm font-medium
                  ${game.optimized 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-500 hover:bg-red-400 text-white'
                  }
                `}>
                  {game.optimized ? 'Update Optimization' : 'Optimize'}
                </button>
                <button className="w-10 h-10 rounded-md bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H18C18.5523 20 19 19.5523 19 19V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 11V16M16 8L21 3M19 3H16M21 3V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredGames.length === 0 && (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
            <Gamepad2 size={32} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white">No games found</h3>
          <p className="text-gray-400 text-center mt-2 max-w-md">
            We couldn't find any games matching your search criteria. Try adjusting your filters or scan for new games.
          </p>
          <button className="mt-4 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-medium transition-colors duration-150">
            Scan for Games
          </button>
        </div>
      )}
    </div>
  );
};