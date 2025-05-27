import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Globe, Monitor, Shield, RotateCcw } from 'lucide-react';
import { UpdateModal } from '../components/modals/UpdateModal';
import { BugReportModal } from '../components/modals/BugReportModal';
import { ChatWidget } from '../components/chat/ChatWidget';
import { createCheckoutSession } from '../lib/stripe';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import { useSettings } from '../hooks/useSettings';

export const Settings: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const { settings, updateSettings } = useSettings();
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isBugReportModalOpen, setIsBugReportModalOpen] = useState(false);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleToggleSetting = async (key: string) => {
    try {
      await updateSettings({
        [key]: !settings[key as keyof typeof settings]
      });
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    await changeLanguage(newLanguage);
  };

  const handleUpgradeToPro = async () => {
    try {
      const checkoutUrl = await createCheckoutSession(
        'price_1RMWKnH2pA9wm7hmLpmpGkn5',
        'subscription'
      );
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingForUpdates(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsCheckingForUpdates(false);
    setIsUpdateModalOpen(true);
  };

  const handleKnowledgeBase = () => {
    window.open('https://docs.gamepathai.com', '_blank');
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // Simulate reset operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Reset settings logic would go here
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Configure your GamePath AI experience</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleReset}
              disabled={isResetting}
              className={`
                relative px-4 py-2 rounded-lg font-medium
                transition-all duration-300 transform
                ${isResetting 
                  ? 'bg-red-500 text-white cursor-wait'
                  : 'bg-gray-700 hover:bg-red-500 text-white hover:scale-105'
                }
                overflow-hidden group
              `}
            >
              <span className="relative z-10 flex items-center">
                <RotateCcw 
                  size={16} 
                  className={`mr-2 transition-transform duration-700 ${
                    isResetting ? 'animate-spin' : 'group-hover:rotate-180'
                  }`}
                />
                Reset Settings
              </span>
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
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
              {t('settings:sections.general.title')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                    <SettingsIcon className="text-gray-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {t('settings:sections.general.startWithWindows.label')}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {t('settings:sections.general.startWithWindows.description')}
                    </p>
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
                    <h3 className="text-sm font-medium text-white">
                      {t('settings:sections.general.minimizeToTray.label')}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {t('settings:sections.general.minimizeToTray.description')}
                    </p>
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
                    <Globe className="text-gray-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {t('settings:sections.general.language.label')}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {t('settings:sections.general.language.description')}
                    </p>
                  </div>
                </div>
                <select 
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                  className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {Object.entries(languages).map(([code, lang]) => (
                    <option key={code} value={code}>
                      {lang.nativeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Account & Version Info */}
        <div className="space-y-6">
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-gray-500 rounded-sm mr-2"></span>
              {t('settings:sections.account.title')}
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
                <h4 className="text-sm text-white font-medium mb-3">
                  {t('settings:sections.account.planDetails')}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-400">{t('settings:sections.account.status')}:</div>
                  <div className="text-green-400 font-medium">Active</div>
                  <div className="text-gray-400">{t('settings:sections.account.plan')}:</div>
                  <div className="text-white">Free</div>
                  <div className="text-gray-400">{t('settings:sections.account.limits')}:</div>
                  <div className="text-white">Basic optimization</div>
                </div>
              </div>
              
              <button
                onClick={handleUpgradeToPro}
                className="w-full mt-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-cyan-600 text-sm font-medium text-white hover:from-purple-500 hover:to-cyan-500 transition-all duration-200"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
          
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-gray-500 rounded-sm mr-2"></span>
              {t('settings:sections.about.title')}
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('settings:sections.about.version')}</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('settings:sections.about.build')}</span>
                <span className="text-white">2025.06.15</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('settings:sections.about.license')}</span>
                <span className="text-white">Commercial</span>
              </div>
              
              <div className="pt-3 border-t border-gray-700 mt-3">
                <button
                  onClick={handleCheckForUpdates}
                  disabled={isCheckingForUpdates}
                  className="w-full py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white flex items-center justify-center transition-colors duration-150"
                >
                  {isCheckingForUpdates ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Checking for Updates...
                    </>
                  ) : (
                    'Check for Updates'
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-gray-500 rounded-sm mr-2"></span>
              {t('settings:sections.support.title')}
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={handleKnowledgeBase}
                className="w-full py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white flex items-center justify-center transition-colors duration-150"
              >
                View Knowledge Base
              </button>
              
              <button 
                className="w-full py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white flex items-center justify-center transition-colors duration-150"
              >
                Contact Support
              </button>
              
              <button 
                onClick={() => setIsBugReportModalOpen(true)}
                className="w-full py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white flex items-center justify-center transition-colors duration-150"
              >
                Report an Issue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        currentVersion="1.0.0"
        newVersion="1.1.0"
        isUpToDate={false}
      />

      <BugReportModal
        isOpen={isBugReportModalOpen}
        onClose={() => setIsBugReportModalOpen(false)}
      />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};