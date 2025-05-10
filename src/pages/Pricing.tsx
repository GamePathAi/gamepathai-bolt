import React, { useState } from 'react';
import { Shield, Zap, Users, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../lib/stripe';
import { products } from '../stripe-config';
import { useAuthStore } from '../stores/authStore';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        navigate('/auth/login', { state: { from: '/pricing' } });
        return;
      }

      const checkoutUrl = await createCheckoutSession(priceId, 'subscription');
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      // You could show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Start with a 3-day free trial. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Player Plan */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Player</h3>
                <p className="text-sm text-gray-400">For solo gamers</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Shield className="text-cyan-400" size={24} />
              </div>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold text-white">$9.99</div>
              <div className="text-sm text-gray-400">per month</div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-cyan-400 mr-2" />
                Basic optimization
              </li>
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-cyan-400 mr-2" />
                Standard VPN access
              </li>
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-cyan-400 mr-2" />
                Basic analytics
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe(products[2].priceId)}
              disabled={isLoading}
              className="w-full py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Start Free Trial'}
            </button>
          </div>

          {/* Co-op Plan */}
          <div className="bg-gray-800 border border-purple-500 rounded-lg p-6 relative transform hover:scale-105 transition-all duration-200">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 rounded-full text-xs font-bold text-white">
              POPULAR
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Co-op</h3>
                <p className="text-sm text-gray-400">For gaming duo</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="text-purple-400" size={24} />
              </div>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold text-white">$17.99</div>
              <div className="text-sm text-gray-400">per month</div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-purple-400 mr-2" />
                Advanced optimization
              </li>
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-purple-400 mr-2" />
                Premium VPN servers
              </li>
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-purple-400 mr-2" />
                Detailed analytics
              </li>
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-purple-400 mr-2" />
                Priority support
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe(products[1].priceId)}
              disabled={isLoading}
              className="w-full py-2 rounded-md bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Start Free Trial'}
            </button>
          </div>

          {/* Alliance Plan */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500/50 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Alliance</h3>
                <p className="text-sm text-gray-400">For gaming teams</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Zap className="text-red-400" size={24} />
              </div>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold text-white">$34.99</div>
              <div className="text-sm text-gray-400">per month</div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-red-400 mr-2" />
                Team optimization
              </li>
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-red-400 mr-2" />
                Dedicated servers
              </li>
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-red-400 mr-2" />
                Business analytics
              </li>
              <li className="flex items-center text-gray-300">
                <Check size={20} className="text-red-400 mr-2" />
                24/7 support
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe(products[0].priceId)}
              disabled={isLoading}
              className="w-full py-2 rounded-md bg-red-500 hover:bg-red-400 text-white font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Start Free Trial'}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400">
            All plans include a 3-day free trial. Cancel anytime. No credit card required.
          </p>
        </div>
      </div>
    </div>
  );
};