import React from 'react';

interface LogoProps {
  variant?: 'color' | 'mono';
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'color', 
  className = '', 
  size = 40 
}) => {
  const colors = {
    primary: variant === 'color' ? '#06b6d4' : '#ffffff',
    secondary: variant === 'color' ? '#9333ea' : '#ffffff',
    accent: variant === 'color' ? '#10b981' : '#ffffff',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Neural Network Base */}
      <path
        d="M20 4L8 12V28L20 36L32 28V12L20 4Z"
        stroke={colors.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={`${colors.primary}10`}
      />

      {/* Neural Network Nodes */}
      <circle cx="20" cy="4" r="2" fill={colors.primary} />
      <circle cx="8" cy="12" r="2" fill={colors.secondary} />
      <circle cx="32" cy="12" r="2" fill={colors.secondary} />
      <circle cx="8" cy="28" r="2" fill={colors.secondary} />
      <circle cx="32" cy="28" r="2" fill={colors.secondary} />
      <circle cx="20" cy="36" r="2" fill={colors.primary} />
      <circle cx="20" cy="20" r="2" fill={colors.accent} />

      {/* Neural Network Connections */}
      <path
        d="M20 6L8 12M20 6L32 12M8 12V28M32 12V28M8 28L20 34M32 28L20 34"
        stroke={colors.primary}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Central Connections */}
      <path
        d="M20 6L20 18M8 12L18 20M32 12L22 20M8 28L18 20M32 28L22 20M20 22L20 34"
        stroke={colors.accent}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Ascending Path Effect */}
      <path
        d="M16 24L20 16L24 24"
        stroke={colors.accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Infinity Loop */}
      <path
        d="M17 20C17 18.3431 18.3431 17 20 17C21.6569 17 23 18.3431 23 20C23 21.6569 21.6569 23 20 23C18.3431 23 17 21.6569 17 20Z"
        stroke={colors.primary}
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
};