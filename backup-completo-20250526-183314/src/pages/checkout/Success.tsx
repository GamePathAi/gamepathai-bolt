import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export const CheckoutSuccess: React.FC = () => {
  useEffect(() => {
    // You could trigger any post-purchase actions here
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-gray-400">
            Thank you for your purchase. Your account has been upgraded.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <p className="text-gray-300 mb-4">
            You now have access to all the features included in your plan. Start optimizing your gaming experience today!
          </p>
          
          <Link
            to="/app"
            className="block w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-medium rounded-lg hover:from-cyan-400 hover:to-cyan-300 transition-all duration-200"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          If you have any questions, please contact our support team.
        </p>
      </div>
    </div>
  );
};