import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Shield, AlertTriangle, Check } from 'lucide-react';

interface PasswordUpdateFormProps {
  onSuccess?: () => void;
}

export const PasswordUpdateForm: React.FC<PasswordUpdateFormProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const updatePassword = useAuthStore((state) => state.updatePassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(password);
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Shield className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Update Password</h2>
        <p className="text-gray-400">Create a new secure password</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="text-red-400 mr-2" size={20} />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Check className="text-green-400 mr-2" size={20} />
            <p className="text-green-400 text-sm">Password updated successfully!</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-medium rounded-lg hover:from-cyan-400 hover:to-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : success ? (
            'Password Updated'
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );
};