import React, { useState, useEffect } from 'react';
import { Zap, Cpu, Network, Shield, Lock } from 'lucide-react';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  level: number;
  maxLevel: number;
  effect: number;
  category: 'performance' | 'network' | 'security' | 'optimization';
  icon: React.ElementType;
  unlockLevel?: number;
  isPro?: boolean;
}

export const Upgrades: React.FC = () => {
  const [credits, setCredits] = useState(() => {
    const saved = localStorage.getItem('gamePathAI_credits');
    return saved ? parseInt(saved, 10) : 1000;
  });

  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    const saved = localStorage.getItem('gamePathAI_upgrades');
    return saved ? JSON.parse(saved) : [
      {
        id: 'cpu_optimization',
        name: 'CPU Optimization',
        description: 'Improves overall system performance and reduces latency',
        baseCost: 100,
        level: 0,
        maxLevel: 10,
        effect: 0.05, // 5% improvement per level
        category: 'performance',
        icon: Cpu
      },
      {
        id: 'network_routing',
        name: 'Smart Network Routing',
        description: 'Optimizes network paths for better connection stability',
        baseCost: 150,
        level: 0,
        maxLevel: 8,
        effect: 0.08, // 8% improvement per level
        category: 'network',
        icon: Network
      },
      {
        id: 'memory_boost',
        name: 'Memory Boost',
        description: 'Enhances memory management and reduces stuttering',
        baseCost: 200,
        level: 0,
        maxLevel: 5,
        effect: 0.1, // 10% improvement per level
        category: 'performance',
        icon: Zap,
        unlockLevel: 2
      },
      {
        id: 'ddos_protection',
        name: 'DDoS Protection',
        description: 'Advanced security against network attacks',
        baseCost: 500,
        level: 0,
        maxLevel: 3,
        effect: 0.15, // 15% improvement per level
        category: 'security',
        icon: Shield,
        isPro: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('gamePathAI_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    localStorage.setItem('gamePathAI_credits', credits.toString());
  }, [credits]);

  const calculateUpgradeCost = (upgrade: Upgrade): number => {
    return Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
  };

  const calculateTotalEffect = (upgrade: Upgrade): number => {
    return upgrade.effect * upgrade.level * 100;
  };

  const canPurchaseUpgrade = (upgrade: Upgrade): boolean => {
    if (upgrade.isPro) return false;
    if (upgrade.level >= upgrade.maxLevel) return false;
    if (upgrade.unlockLevel && getPlayerLevel() < upgrade.unlockLevel) return false;
    return calculateUpgradeCost(upgrade) <= credits;
  };

  const getPlayerLevel = (): number => {
    return Math.floor(upgrades.reduce((sum, upgrade) => sum + upgrade.level, 0) / 3);
  };

  const purchaseUpgrade = (upgradeId: string) => {
    setUpgrades(prevUpgrades => {
      const newUpgrades = prevUpgrades.map(upgrade => {
        if (upgrade.id === upgradeId && canPurchaseUpgrade(upgrade)) {
          const cost = calculateUpgradeCost(upgrade);
          setCredits(prev => prev - cost);
          return { ...upgrade, level: upgrade.level + 1 };
        }
        return upgrade;
      });
      return newUpgrades;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Upgrades</h1>
            <p className="text-gray-400 mt-1">
              Enhance your gaming experience with powerful upgrades
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gray-700/50 rounded-lg px-4 py-2 flex items-center">
              <Zap className="text-yellow-400 mr-2" size={18} />
              <div>
                <div className="text-xs text-gray-400">Credits</div>
                <div className="text-lg font-bold text-white">{credits}</div>
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg px-4 py-2 flex items-center">
              <Shield className="text-purple-400 mr-2" size={18} />
              <div>
                <div className="text-xs text-gray-400">Level</div>
                <div className="text-lg font-bold text-white">{getPlayerLevel()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upgrades.map((upgrade) => {
          const cost = calculateUpgradeCost(upgrade);
          const effect = calculateTotalEffect(upgrade);
          const canPurchase = canPurchaseUpgrade(upgrade);
          const Icon = upgrade.icon;
          
          return (
            <div 
              key={upgrade.id}
              className={`
                relative overflow-hidden bg-gray-800/60 backdrop-blur-sm border rounded-lg p-4
                ${upgrade.isPro 
                  ? 'border-purple-500/20' 
                  : canPurchase 
                    ? 'border-green-500/20 hover:border-green-500/40' 
                    : 'border-gray-700'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mr-3
                    ${upgrade.isPro ? 'bg-purple-500/20' : 'bg-gray-700'}
                  `}>
                    <Icon className={upgrade.isPro ? 'text-purple-400' : 'text-gray-400'} size={20} />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-white">{upgrade.name}</h3>
                      {upgrade.isPro && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">PRO</span>
                      )}
                      {upgrade.unlockLevel && getPlayerLevel() < upgrade.unlockLevel && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded">
                          Unlocks at level {upgrade.unlockLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{upgrade.description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Level</span>
                  <span className="text-white font-medium">
                    {upgrade.level} / {upgrade.maxLevel}
                  </span>
                </div>

                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      upgrade.isPro ? 'bg-purple-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(upgrade.level / upgrade.maxLevel) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Effect</span>
                  <span className="text-white font-medium">+{effect.toFixed(1)}%</span>
                </div>

                {upgrade.isPro ? (
                  <button 
                    className="w-full py-2 rounded-md bg-purple-500/20 text-purple-300 font-medium cursor-not-allowed flex items-center justify-center"
                    disabled
                  >
                    <Lock size={16} className="mr-2" />
                    Pro Feature
                  </button>
                ) : (
                  <button
                    onClick={() => purchaseUpgrade(upgrade.id)}
                    disabled={!canPurchase}
                    className={`
                      w-full py-2 rounded-md font-medium transition-colors duration-150
                      flex items-center justify-center
                      ${canPurchase
                        ? 'bg-green-500 hover:bg-green-400 text-black'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {upgrade.level >= upgrade.maxLevel ? (
                      'Maxed Out'
                    ) : (
                      <>
                        <Zap size={16} className="mr-2" />
                        Upgrade ({cost} Credits)
                      </>
                    )}
                  </button>
                )}
              </div>

              {upgrade.isPro && (
                <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center p-2 rounded-lg bg-purple-500/20 border border-purple-500/40">
                    <Lock size={14} className="text-purple-400 mr-1" />
                    <span className="text-xs text-purple-300">Pro Feature</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};