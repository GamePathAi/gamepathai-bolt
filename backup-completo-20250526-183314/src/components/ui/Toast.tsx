import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const toastVariants = cva(
  "fixed bottom-4 right-4 flex items-center gap-2 p-4 rounded-lg shadow-lg border transition-all transform translate-y-0 opacity-100",
  {
    variants: {
      variant: {
        default: "bg-gray-800 border-gray-700",
        success: "bg-green-500/10 border-green-500/50",
        error: "bg-red-500/10 border-red-500/50",
        warning: "bg-yellow-500/10 border-yellow-500/50",
        info: "bg-cyan-500/10 border-cyan-500/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ToastProps extends VariantProps<typeof toastVariants> {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={toastVariants({ variant })}>
      <span className="text-sm text-white">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-700/50 transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>
      )}
    </div>
  );
};