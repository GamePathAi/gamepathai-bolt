import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, header, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden ${className}`}
        {...props}
      >
        {header && (
          <div className="p-4 border-b border-gray-700">
            {header}
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
        {footer && (
          <div className="p-4 border-t border-gray-700 bg-gray-900/50">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = "Card";