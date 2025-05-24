import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PasswordUpdateForm } from '../../components/auth/PasswordUpdateForm';

export const UpdatePassword: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to login after successful password update
    setTimeout(() => {
      navigate('/auth/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <PasswordUpdateForm onSuccess={handleSuccess} />
        
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