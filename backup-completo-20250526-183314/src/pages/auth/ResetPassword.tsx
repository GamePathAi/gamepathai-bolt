import React from 'react';
import { Link } from 'react-router-dom';
import { PasswordResetForm } from '../../components/auth/PasswordResetForm';

export const ResetPassword: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <PasswordResetForm />
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Remember your password?{' '}
            <Link to="/auth/login" className="text-cyan-400 hover:text-cyan-300">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};