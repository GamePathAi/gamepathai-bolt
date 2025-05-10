import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { LayoutDashboard, Network, Zap, TowerControl as GameController, Shield, Settings, ChevronRight, BarChart } from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen,
  setIsOpen
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/app' },
    { id: 'network', label: 'Network Optimizer', icon: Network, path: '/app/network' },
    { id: 'fps', label: 'FPS Booster', icon: Zap, path: '/app/fps' },
    { id: 'games', label: 'Games Library', icon: GameController, path: '/app/games' },
    { id: 'vpn', label: 'VPN Manager', icon: Shield, path: '/app/vpn' },
    { id: 'performance', label: 'Performance Analysis', icon: BarChart, path: '/app/performance' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/app/settings' },
  ];

  // Update active tab based on current path
  React.useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = navItems.find(item => item.path === currentPath);
    if (currentItem && currentItem.id !== activeTab) {
      setActiveTab(currentItem.id);
    }
  }, [location.pathname, activeTab, setActiveTab]);

  const handleNavigation = (item: typeof navItems[0]) => {
    setActiveTab(item.id);
    navigate(item.path);
    if (!isDesktop) setIsOpen(false);
  };

  const isDesktop = window.innerWidth >= 1024;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static h-full z-30 transition-all duration-300 ease-in-out
        ${isOpen ? 'left-0' : '-left-64'}
        w-64 bg-gray-800 border-r border-cyan-500/20 shadow-xl shadow-cyan-500/5
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo size={32} variant="color" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                  GamePath AI
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-gray-700 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavigation(item)}
                      className={`
                        w-full flex items-center px-3 py-2 rounded-md text-sm
                        transition-all duration-200 group relative
                        ${isActive 
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-white' 
                          : 'hover:bg-gray-700/50 text-gray-400'}
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400"></div>
                      )}
                      <Icon 
                        className={`mr-3 transition-transform duration-200 ${
                          isActive ? 'text-cyan-400 transform scale-110' : ''
                        }`} 
                        size={18} 
                      />
                      <span className={`transition-colors duration-200 ${
                        isActive ? 'font-medium' : ''
                      }`}>{item.label}</span>
                      {isActive && (
                        <ChevronRight size={16} className="ml-auto text-cyan-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User status */}
          <div className="p-4 border-t border-cyan-500/20">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                U
              </div>
              <div className="ml-2">
                <div className="text-sm font-medium text-white">User</div>
                <div className="text-xs text-gray-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  Online
                </div>
              </div>
              <div className="ml-auto">
                <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300">
                  Free
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};