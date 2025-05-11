import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { Logo } from './Logo';
import { Link } from 'react-router-dom';
import { UserProfile } from './UserProfile';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="h-16 bg-gray-800/50 backdrop-blur-sm border-b border-cyan-500/20 flex items-center justify-between px-4 z-10">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="ml-4 lg:ml-0 flex items-center gap-3">
          <Logo size={24} variant="color" className="hidden sm:block" />
          <div>
            <h1 className="text-lg font-bold text-gray-100">Dashboard</h1>
            <p className="text-xs text-gray-400">Optimize your gaming experience</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notification Icon */}
        <button className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500"></span>
        </button>
        
        {/* Pro Upgrade Button */}
        <Link 
          to="/pricing"
          className="hidden sm:flex items-center px-3 py-1.5 rounded-md bg-gradient-to-r from-purple-600 to-cyan-600 text-xs font-medium text-white hover:from-purple-500 hover:to-cyan-500 transition-all duration-200"
        >
          Upgrade to Pro
        </Link>

        {/* User Profile */}
        <UserProfile />
      </div>
    </header>
  );
};