import React from 'react';
import { xssProtection } from '../../lib/security/xssProtection';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = xssProtection.validateUserInput(e.target.value);
      e.target.value = sanitizedValue;
      onChange?.(e);
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {xssProtection.sanitize(label)}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            onChange={handleChange}
            className={`
              w-full px-4 py-2 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors
              ${icon ? 'pl-10' : ''}
              ${error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-600 focus:border-cyan-500 focus:ring-cyan-500/20'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400">{xssProtection.sanitize(error)}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";