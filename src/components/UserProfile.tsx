import React, { useState } from 'react';
import { 
  User, ChevronDown, Trophy, Star, Zap, 
  Award, Settings, History, LogOut 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

interface UserStats {
  gamesOptimized: number;
  totalUsageHours: number;
  averageImprovement: number;
  level: number;
  xp: number;
  xpNeeded: number;
}

const calculateLevel = (xp: number): { level: number; progress: number } => {
  const baseXP = 1000;
  const level = Math.floor(Math.log2(xp / baseXP + 1)) + 1;
  const currentLevelXP = baseXP * (Math.pow(2, level - 1) - 1);
  const nextLevelXP = baseXP * (Math.pow(2, level) - 1);
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return { level, progress };
};

const getLevelTitle = (level: number): string => {
  if (level < 5) return 'Novice';
  if (level < 10) return 'Apprentice';
  if (level < 15) return 'Intermediate';
  if (level < 20) return 'Advanced';
  if (level < 25) return 'Expert';
  if (level < 30) return 'Master';
  return 'Grandmaster';
};

export const UserProfile: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  // Simulated user stats - in a real app, this would come from your backend
  const stats: UserStats = {
    gamesOptimized: 12,
    totalUsageHours: 48,
    averageImprovement: 27,
    level: 8,
    xp: 8750,
    xpNeeded: 16000
  };

  const { level, progress } = calculateLevel(stats.xp);
  const levelTitle = getLevelTitle(level);

  const badges = [
    { id: 1, name: 'FPS Master', icon: Zap, description: 'Achieved 50% FPS improvement', earned: true },
    { id: 2, name: 'Network Guru', icon: Trophy, description: 'Reduced latency by 40%', earned: true },
    { id: 3, name: 'Optimization Expert', icon: Star, description: 'Optimized 10 games', earned: true },
    { id: 4, name: 'Performance Legend', icon: Award, description: 'Maintained 99% stability', earned: false },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
          {user?.email?.[0].toUpperCase() || 'U'}
        </div>
        <div className="text-left">
          <div className="flex items-center">
            <span className="text-sm font-medium text-white">{levelTitle}</span>
            <ChevronDown size={16} className="ml-1 text-gray-400" />
          </div>
          <div className="text-xs text-gray-400">Level {level}</div>
        </div>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
          {/* Profile Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-white font-medium">{user?.email}</h3>
                <div className="text-sm text-gray-400">{levelTitle}</div>
                <div className="mt-2 text-xs text-gray-400">
                  Level {level} • {Math.round(progress)}% to Level {level + 1}
                </div>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mt-3">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{stats.gamesOptimized}</div>
              <div className="text-xs text-gray-400">Games Optimized</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{stats.totalUsageHours}h</div>
              <div className="text-xs text-gray-400">Total Usage</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">+{stats.averageImprovement}%</div>
              <div className="text-xs text-gray-400">Avg. Improvement</div>
            </div>
          </div>

          {/* Badges */}
          <div className="p-4 border-b border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Achievements</h4>
            <div className="grid grid-cols-2 gap-2">
              {badges.map(badge => (
                <div 
                  key={badge.id}
                  className={`flex items-center p-2 rounded-lg ${
                    badge.earned 
                      ? 'bg-gray-700/50 text-white' 
                      : 'bg-gray-700/20 text-gray-500'
                  }`}
                >
                  <badge.icon size={16} className="mr-2" />
                  <div>
                    <div className="text-xs font-medium">{badge.name}</div>
                    <div className="text-xs opacity-60">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Options */}
          <div className="p-2">
            <button 
              onClick={() => navigate('/app/settings')}
              className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-700/50 text-left text-sm text-gray-300 transition-colors"
            >
              <Settings size={16} className="mr-2" />
              Settings
            </button>
            <button 
              className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-700/50 text-left text-sm text-gray-300 transition-colors"
            >
              <History size={16} className="mr-2" />
              Optimization History
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-700/50 text-left text-sm text-red-400 transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};