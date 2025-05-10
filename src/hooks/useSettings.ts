import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';

interface Settings {
  startWithWindows: boolean;
  minimizeToTray: boolean;
  darkMode: boolean;
}

const SETTINGS_KEY = 'app_settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    startWithWindows: true,
    minimizeToTray: true,
    darkMode: true,
  });

  useEffect(() => {
    // Load settings from storage on mount
    const loadSettings = async () => {
      try {
        const storedSettings = await get(SETTINGS_KEY);
        if (storedSettings) {
          setSettings(storedSettings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await set(SETTINGS_KEY, updatedSettings);

      // Apply settings
      if ('darkMode' in newSettings) {
        document.documentElement.classList.toggle('dark', newSettings.darkMode);
      }

      // Handle system integration settings
      if ('startWithWindows' in newSettings) {
        // In a real app, this would interact with the system
        console.log('Start with Windows:', newSettings.startWithWindows);
      }

      if ('minimizeToTray' in newSettings) {
        // In a real app, this would configure tray behavior
        console.log('Minimize to tray:', newSettings.minimizeToTray);
      }

    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  return {
    settings,
    updateSettings,
  };
};