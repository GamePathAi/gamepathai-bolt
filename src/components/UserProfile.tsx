import React, { useState, useEffect } from 'react';
import { 
  User, ChevronDown, Trophy, Star, Zap, 
  Award, Settings, History, LogOut, Clock 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface UserProfile {
  display_name: string;
  created_at: string;
  level: number;
  xp: number;
  games_optimized: number;
  total_usage_hours: number;
  average_improvement: number;
  trial_started_at: string;
  trial_ended_at: string | null;
  is_pro: boolean;
}

const calculateTrialDaysLeft = (createdAt: string): number => {
  const trialLength = 3; // 3 days trial
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, trialLength - diffDays);
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert([
                {
                  user_id: user.id,
                  display_name: user.email?.split('@')[0] || 'User',
                  trial_started_at: new Date().toISOString(),
                  trial_ended_at: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString(),
                  is_pro: false
                }
              ])
              .select()
              .single();

            if (createError) {
              console.error('Error creating profile:', createError);
              return;
            }

            setProfile(newProfile);
          } else {
            console.error('Error fetching profile:', error);
          }
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error('Error in fetchProfile:', err);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  if (!profile) return null;

  const daysLeft = calculateTrialDaysLeft(profile.trial_started_at);
  const isTrialExpired = daysLeft === 0;
  const levelTitle = getLevelTitle(profile.level);

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
          {profile.display_name[0].toUpperCase()}
        </div>
        <div className="text-left">
          <div className="flex items-center">
            <span className="text-sm font-medium text-white">{profile.display_name}</span>
            <ChevronDown size={16} className={`ml-1 text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </div>
          <div className="text-xs text-gray-400">Level {profile.level}</div>
        </div>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
          {/* Profile Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                {profile.display_name[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-white font-medium">{profile.display_name}</h3>
                <div className="text-sm text-gray-400">{levelTitle}</div>
                {!isTrialExpired ? (
                  <div className="mt-2 flex items-center text-xs text-cyan-400">
                    <Clock size={12} className="mr-1" />
                    {daysLeft} days left in trial
                  </div>
                ) : (
                  <div className="mt-2 flex items-center text-xs text-red-400">
                    <Clock size={12} className="mr-1" />
                    Trial expired
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{profile.games_optimized}</div>
              <div className="text-xs text-gray-400">Games Optimized</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{profile.total_usage_hours}h</div>
              <div className="text-xs text-gray-400">Total Usage</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">+{profile.average_improvement}%</div>
              <div className="text-xs text-gray-400">Avg. Improvement</div>
            </div>
          </div>

          {/* Menu Options */}
          <div className="p-2">
            <button 
              onClick={() => {
                navigate('/app/settings');
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-700/50 text-left text-sm text-gray-300 transition-colors"
            >
              <Settings size={16} className="mr-2" />
              Settings
            </button>
            
            {isTrialExpired && (
              <button 
                onClick={() => {
                  navigate('/pricing');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-left text-sm text-purple-300 transition-colors"
              >
                <Star size={16} className="mr-2" />
                Upgrade to Pro
              </button>
            )}
            
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-red-500/10 text-left text-sm text-red-400 transition-colors"
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