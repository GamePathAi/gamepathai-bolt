import React, { useState } from 'react';
import { Zap } from 'lucide-react';

export const OptimizeButton: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsOptimizing(false);
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  return (
    <button
      onClick={handleOptimize}
      disabled={isOptimizing}
      className={`
        relative overflow-hidden group
        px-6 py-3 rounded-md font-medium text-black
        transition-all duration-300
        bg-gradient-to-r from-cyan-400 to-cyan-500
        hover:from-cyan-300 hover:to-cyan-400
        disabled:opacity-80
        flex items-center
      `}
    >
      {isOptimizing ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-100"></div>
          <div 
            className="absolute inset-0 bg-cyan-400 origin-left" 
            style={{ transform: `scaleX(${progress / 100})`, transition: 'transform 0.3s ease-out' }}
          ></div>
          <span className="relative z-10 flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Optimizing {Math.round(progress)}%
          </span>
        </>
      ) : (
        <>
          <span className="relative z-10 flex items-center">
            <Zap className="mr-2" size={18} />
            One-Click Optimize
          </span>
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
        </>
      )}
    </button>
  );
};