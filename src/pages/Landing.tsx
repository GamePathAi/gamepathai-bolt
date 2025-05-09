import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, Gamepad2, Download, Apple, Cuboid as Android } from 'lucide-react';

export const Landing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  const pricingPlans = {
    player: {
      monthly: { price: 9.99, period: 'mo' },
      quarterly: { price: 26.99, period: '3 months', savings: '10%' },
      annual: { price: 89.99, period: 'year', savings: '25%' }
    },
    coop: {
      monthly: { price: 17.99, period: 'mo' },
      quarterly: { price: 47.99, period: '3 months', savings: '10%' },
      annual: { price: 159.99, period: 'year', savings: '25%' }
    },
    alliance: {
      monthly: { price: 34.99, period: 'mo' },
      quarterly: { price: 94.99, period: '3 months', savings: '10%' },
      annual: { price: 314.99, period: 'year', savings: '25%' }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10"></div>
        <div className="absolute inset-0 cyberpunk-circuit opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6">
              GamePath AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Advanced AI-powered game optimization for the ultimate gaming experience
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button className="px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold flex items-center hover:from-cyan-400 hover:to-cyan-300 transition-all duration-200">
                <Download className="mr-2" size={20} />
                Download for Windows
              </button>
              <div className="flex gap-4">
                <button className="px-6 py-4 rounded-lg bg-gray-800 text-white font-medium flex items-center hover:bg-gray-700 transition-all duration-200">
                  <Apple className="mr-2" size={20} />
                  iOS App
                </button>
                <button className="px-6 py-4 rounded-lg bg-gray-800 text-white font-medium flex items-center hover:bg-gray-700 transition-all duration-200">
                  <Android className="mr-2" size={20} />
                  Android App
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-25"></div>
              <div className="relative bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="GamePath AI Dashboard" 
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose GamePath AI?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience the next generation of game optimization with our advanced AI technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all duration-200">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-cyan-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered Optimization</h3>
              <p className="text-gray-400">
                Our advanced AI algorithms analyze and optimize your gaming performance in real-time
              </p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-200">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Secure Gaming VPN</h3>
              <p className="text-gray-400">
                Protected gaming sessions with optimized routes and DDoS protection
              </p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500/50 transition-all duration-200">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                <Gamepad2 className="text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Game Detection</h3>
              <p className="text-gray-400">
                Automatic game detection and optimization profiles for maximum performance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Select the perfect plan for your gaming needs
            </p>

            {/* Billing Cycle Selector */}
            <div className="inline-flex rounded-lg border border-gray-700 p-1 bg-gray-800/50 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === 'monthly'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('quarterly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === 'quarterly'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Quarterly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === 'annual'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Player Plan */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all duration-200">
              <div className="text-cyan-400 font-bold mb-2">PLAYER</div>
              <div className="text-3xl font-bold text-white mb-1">
                ${pricingPlans.player[billingCycle].price}
                <span className="text-sm text-gray-400">/{pricingPlans.player[billingCycle].period}</span>
              </div>
              {billingCycle !== 'monthly' && (
                <div className="text-sm text-green-400 mb-4">Save {pricingPlans.player[billingCycle].savings}</div>
              )}
              <p className="text-gray-400 mb-6">Perfect for individual gamers</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  </div>
                  Basic optimization
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  </div>
                  Standard VPN access
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  </div>
                  Basic analytics
                </li>
              </ul>
              <button className="w-full py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-medium transition-colors duration-150">
                Get Started
              </button>
            </div>

            {/* Co-op Plan */}
            <div className="bg-gray-800 border border-purple-500 rounded-lg p-6 relative transform hover:scale-105 transition-all duration-200">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 rounded-full text-xs font-bold text-white">
                POPULAR
              </div>
              <div className="text-purple-400 font-bold mb-2">CO-OP</div>
              <div className="text-3xl font-bold text-white mb-1">
                ${pricingPlans.coop[billingCycle].price}
                <span className="text-sm text-gray-400">/{pricingPlans.coop[billingCycle].period}</span>
              </div>
              {billingCycle !== 'monthly' && (
                <div className="text-sm text-green-400 mb-4">Save {pricingPlans.coop[billingCycle].savings}</div>
              )}
              <p className="text-gray-400 mb-6">Ideal for gaming duo</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  </div>
                  Advanced optimization
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  </div>
                  Premium VPN servers
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  </div>
                  Detailed analytics
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  </div>
                  Priority support
                </li>
              </ul>
              <button className="w-full py-2 rounded-md bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300 text-white font-medium transition-all duration-200">
                Get Started
              </button>
            </div>

            {/* Alliance Plan */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500/50 transition-all duration-200">
              <div className="text-red-400 font-bold mb-2">ALLIANCE</div>
              <div className="text-3xl font-bold text-white mb-1">
                ${pricingPlans.alliance[billingCycle].price}
                <span className="text-sm text-gray-400">/{pricingPlans.alliance[billingCycle].period}</span>
              </div>
              {billingCycle !== 'monthly' && (
                <div className="text-sm text-green-400 mb-4">Save {pricingPlans.alliance[billingCycle].savings}</div>
              )}
              <p className="text-gray-400 mb-6">Best for gaming teams</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  Team optimization
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  Dedicated servers
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  Business analytics
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  24/7 support
                </li>
              </ul>
              <button className="w-full py-2 rounded-md bg-red-500 hover:bg-red-400 text-white font-medium transition-colors duration-150">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Enhance Your Gaming?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Join thousands of gamers who have already optimized their gaming experience with GamePath AI
            </p>
            <Link 
              to="/app" 
              className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:from-cyan-400 hover:to-purple-400 transition-all duration-200"
            >
              Get Started Now
              <svg className="ml-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};