import React from 'react';
import { X, Sliders, Cpu, HardDrive, Fan, Clock } from 'lucide-react';

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({ isOpen, onClose }) => {
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
                  <span className="text-purple-400">High</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value="4"
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Thread Optimization</span>
                  <span className="text-purple-400">Enabled</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  value="1"
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
                  <span className="text-purple-400">5 min</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value="5"
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Page File Optimization</span>
                  <span className="text-purple-400">Auto</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  value="1"
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
                  <span className="text-purple-400">Performance</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  value="2"
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Shader Cache</span>
                  <span className="text-purple-400">Enabled</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  value="1"
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
                  <span className="text-purple-400">Ultra</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="3" 
                  value="3"
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Polling Rate</span>
                  <span className="text-purple-400">1000Hz</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="3" 
                  value="3"
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
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-400 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};