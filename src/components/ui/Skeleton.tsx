import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`animate-pulse bg-gray-700/50 rounded-lg ${className}`}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";