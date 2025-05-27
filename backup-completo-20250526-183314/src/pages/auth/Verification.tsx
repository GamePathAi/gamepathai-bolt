import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

export const Verification: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-cyan-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
          <p className="text-gray-400">
            We've sent a verification email to <span className="text-white">{email}</span>
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <p className="text-gray-300 mb-4">
            Please check your email and click the verification link to complete your registration.
          </p>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              If you don't see the email, check your spam folder or try the following:
            </p>
            
            <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
              <li>Make sure the email address is correct</li>
              <li>Check your spam or junk folder</li>
              <li>Wait a few minutes for the email to arrive</li>
            </ul>
          </div>
        </div>

        <Link
          to="/auth/login"
          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to login
        </Link>
      </div>
    </div>
  );
};