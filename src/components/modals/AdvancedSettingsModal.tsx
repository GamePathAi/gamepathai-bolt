import React, { useState } from 'react';
import { X, Sliders, Cpu, HardDrive, Fan, Clock } from 'lucide-react';

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Settings {
  cpu: {
    priority: number;
    threadOptimization: number;
  };
  memory: {
    cleanerInterval: number;
    pageFileOptimization: number;
  };
  gpu: {
    powerMode: number;
    shaderCache: number;
  };
  input: {
    processing: number;
    pollingRate: number;
  };
}

export const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<Settings>({
    cpu: {
      priority: 4,
      threadOptimization: 1,
    },
    memory: {
      cleanerInterval: 5,
      pageFileOptimization: 1,
    },
    gpu: {
      powerMode: 2,
      shaderCache: 1,
    },
    input: {
      processing: 3,
      pollingRate: 3,
    },
  });

  const handleSettingChange = (category: keyof Settings, setting: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleApplyChanges = () => {
    // Here you would typically save the settings to your state management system
    console.log('Applying settings:', settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
            <Sliders className="text-purple-400" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Advanced Settings</h2>
            <p className="text-gray-400 text-sm">Fine-tune your performance optimization</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* CPU Settings */}
          <div className="bg-gray-900/70 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Cpu className="text-purple-400 mr-2" size={18} />
              <h3 className="text-white font-medium">CPU Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Process Priority</span>
                  <span className="text-purple-400">
                    {['Low', 'Medium-Low', 'Medium', 'High', 'Real-time'][settings.cpu.priority - 1]}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={settings.cpu.priority}
                  onChange={(e) => handleSettingChange('cpu', 'priority', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Thread Optimization</span>
                  <span className="text-purple-400">{settings.cpu.threadOptimization ? 'Enabled' : 'Disabled'}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  value={settings.cpu.threadOptimization}
                  onChange={(e) => handleSettingChange('cpu', 'threadOptimization', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Memory Settings */}
          <div className="bg-gray-900/70 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <HardDrive className="text-purple-400 mr-2" size={18} />
              <h3 className="text-white font-medium">Memory Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Memory Cleaner Interval</span>
                  <span className="text-purple-400">{settings.memory.cleanerInterval} min</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={settings.memory.cleanerInterval}
                  onChange={(e) => handleSettingChange('memory', 'cleanerInterval', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Page File Optimization</span>
                  <span className="text-purple-400">
                    {['Manual', 'Auto', 'Dynamic'][settings.memory.pageFileOptimization]}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  value={settings.memory.pageFileOptimization}
                  onChange={(e) => handleSettingChange('memory', 'pageFileOptimization', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
            </div>
          </div>

          {/* GPU Settings */}
          <div className="bg-gray-900/70 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Fan className="text-purple-400 mr-2" size={18} />
              <h3 className="text-white font-medium">GPU Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Power Mode</span>
                  <span className="text-purple-400">
                    {['Balanced', 'Power Saver', 'Performance'][settings.gpu.powerMode]}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  value={settings.gpu.powerMode}
                  onChange={(e) => handleSettingChange('gpu', 'powerMode', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Shader Cache</span>
                  <span className="text-purple-400">{settings.gpu.shaderCache ? 'Enabled' : 'Disabled'}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  value={settings.gpu.shaderCache}
                  onChange={(e) => handleSettingChange('gpu', 'shaderCache', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Input Settings */}
          <div className="bg-gray-900/70 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Clock className="text-purple-400 mr-2" size={18} />
              <h3 className="text-white font-medium">Input Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Input Processing</span>
                  <span className="text-purple-400">
                    {['Basic', 'Standard', 'High', 'Ultra'][settings.input.processing]}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="3" 
                  value={settings.input.processing}
                  onChange={(e) => handleSettingChange('input', 'processing', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Polling Rate</span>
                  <span className="text-purple-400">
                    {['125Hz', '250Hz', '500Hz', '1000Hz'][settings.input.pollingRate]}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="3" 
                  value={settings.input.pollingRate}
                  onChange={(e) => handleSettingChange('input', 'pollingRate', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyChanges}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-400 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};