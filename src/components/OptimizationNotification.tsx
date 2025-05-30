// src/components/OptimizationNotification.tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Zap, Cpu, HardDrive, Gamepad2 } from 'lucide-react';

interface OptimizationNotificationProps {
  show: boolean;
  success: boolean;
  message: string;
  details?: {
    gpuOptimized: boolean;
    memoryCleared: boolean;
    processesCloses: number;
    gamesBoosteds: number;
  };
  onClose: () => void;
}

export const OptimizationNotification: React.FC<OptimizationNotificationProps> = ({
  show,
  success,
  message,
  details,
  onClose
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -100, x: '-50%' }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4"
        >
          <div className={`
            p-4 rounded-lg shadow-2xl backdrop-blur-md border
            ${success 
              ? 'bg-green-900/90 border-green-500/50' 
              : 'bg-red-900/90 border-red-500/50'
            }
          `}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {success ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  {success ? 'Optimization Complete!' : 'Optimization Failed'}
                </h3>
                <p className="text-sm text-gray-300">{message}</p>
                
                {details && success && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className={`w-4 h-4 ${details.gpuOptimized ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={details.gpuOptimized ? 'text-green-300' : 'text-gray-400'}>
                        GPU Optimized
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <HardDrive className={`w-4 h-4 ${details.memoryCleared ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={details.memoryCleared ? 'text-green-300' : 'text-gray-400'}>
                        Memory Cleared
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300">
                        {details.processesCloses} Apps Closed
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Gamepad2 className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300">
                        {details.gamesBoosteds} Games Boosted
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
