import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Globe, Moon, Monitor, Shield } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    startWithWindows: true,
    minimizeToTray: true,
    darkMode: true,
    language: 'en',
    notifications: {
      updates: true,
      optimizationAlerts: true,
      connectionAlerts: false,
    },
    privacy: {
      shareAnalytics: false,
      telemetry: false,
    }
  });
  
  const handleToggleSetting = (key: string) => {
    setSettings({
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    });
  };
  
  const handleToggleNestedSetting = (category: string, key: string) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category as keyof typeof settings],
        [key]: !(settings[category as keyof typeof settings] as any)[key],
      }
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">
              Configure your GamePath AI experience
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors duration-150">
              Reset to Default
            </button>
          </div>
        </div>
      </div>
      
      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-gray-500 rounded-sm mr-2"></span>
              General
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <SettingsIcon className="text-gray-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Start with Windows</h3>
                    <p className="text-xs text-gray-400">Launch application on system startup</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.startWithWindows}
                    onChange={() => handleToggleSetting('startWithWindows')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M10 14L12 16L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Minimize to Tray</h3>
                    <p className="text-xs text-gray-400">Keep running in system tray when closed</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.minimizeToTray}
                    onChange={() => handleToggleSetting('minimizeToTray')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <Moon className="text-gray-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Dark Mode</h3>
                    <p className="text-xs text-gray-400">Use dark theme for the application</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.darkMode}
                    onChange={() => handleToggleSetting('darkMode')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <Globe className="text-gray-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Language</h3>
                    <p className="text-xs text-gray-400">Select your preferred language</p>
                  </div>
                </div>
                <select 
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                  className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="en">English</option>
                  <option value="pt-br">Português (Brasil)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-cyan-500 rounded-sm mr-2"></span>
              Notifications
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Software Updates</h3>
                    <p className="text-xs text-gray-400">Get notified about application updates</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.updates}
                    onChange={() => handleToggleNestedSetting('notifications', 'updates')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Optimization Alerts</h3>
                    <p className="text-xs text-gray-400">Notify when optimization is needed</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.optimizationAlerts}
                    onChange={() => handleToggleNestedSetting('notifications', 'optimizationAlerts')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <Shield className="text-gray-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Connection Alerts</h3>
                    <p className="text-xs text-gray-400">Notify about VPN connection changes</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.connectionAlerts}
                    onChange={() => handleToggleNestedSetting('notifications', 'connectionAlerts')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Privacy Settings */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
              Privacy
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                      <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Share Analytics</h3>
                    <p className="text-xs text-gray-400">Help improve the app by sharing usage data</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.shareAnalytics}
                    onChange={() => handleToggleNestedSetting('privacy', 'shareAnalytics')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Telemetry</h3>
                    <p className="text-xs text-gray-400">Collect performance and diagnostic data</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.telemetry}
                    onChange={() => handleToggleNestedSetting('privacy', 'telemetry')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Account & Version Info */}
        <div className="space-y-6">
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-gray-500 rounded-sm mr-2"></span>
              Account
            </h2>
            
            <div className="border border-gray-700 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-lg font-bold">
                  U
                </div>
                <div className="ml-3">
                  <h3 className="text-md font-medium text-white">User</h3>
                  <p className="text-sm text-gray-400">Free Plan</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm text-white font-medium mb-3">Plan Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-400">Status:</div>
                  <div className="text-green-400 font-medium">Active</div>
                  <div className="text-gray-400">Plan:</div>
                  <div className="text-white">Free</div>
                  <div className="text-gray-400">Limits:</div>
                  <div className="text-white">Basic optimization</div>
                </div>
              </div>
              
              <button className="w-full mt-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-cyan-600 text-sm font-medium text-white">
                Upgrade to Pro
              </button>
            </div>
          </div>
          
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-gray-500 rounded-sm mr-2"></span>
              About
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Version</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Build</span>
                <span className="text-white">2025.06.15</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">License</span>
                <span className="text-white">Commercial</span>
              </div>
              
              <div className="pt-3 border-t border-gray-700 mt-3">
                <button className="w-full py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white">
                  Check for Updates
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-gray-500 rounded-sm mr-2"></span>
              Support
            </h2>
            
            <div className="space-y-3">
              <button className="w-full py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.09 9.00008C9.3251 8.33175 9.78915 7.76819 10.4 7.40921C11.0108 7.05024 11.7289 6.91902 12.4272 7.03879C13.1255 7.15857 13.7588 7.52161 14.2151 8.06361C14.6713 8.60561 14.9211 9.2916 14.92 10.0001C14.92 12.0001 11.92 13.0001 11.92 13.0001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Knowledge Base
              </button>
              
              <button className="w-full py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Live Chat
              </button>
              
              <button className="w-full py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M14 9L9 4L4 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 20H13C11.9391 20 10.9217 19.5786 10.1716 18.8284C9.42143 18.0783 9 17.0609 9 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Send Bug Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};