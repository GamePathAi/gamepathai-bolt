import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export const CheckoutCancel: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h2>
          <p className="text-gray-400">
            Your payment was cancelled and you have not been charged.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <p className="text-gray-300 mb-4">
            If you experienced any issues during checkout or have questions about our plans, our support team is here to help.
          </p>
          
          <div className="space-y-3">
            <Link
              to="/app"
              className="block w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-medium rounded-lg hover:from-cyan-400 hover:to-cyan-300 transition-all duration-200"
            >
              Return to Dashboard
            </Link>
            
            <Link
              to="/pricing"
              className="block w-full py-3 px-4 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              View Plans
            </Link>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Need help? Contact our support team for assistance.
        </p>
      </div>
    </div>
  );
};