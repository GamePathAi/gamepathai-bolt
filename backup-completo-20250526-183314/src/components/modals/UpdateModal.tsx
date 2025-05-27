import React from 'react';
import { X, Download, Check } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  newVersion?: string;
  isUpToDate: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  newVersion,
  isUpToDate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        {isUpToDate ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You're up to date!</h2>
            <p className="text-gray-400">
              GamePath AI version {currentVersion} is currently the newest version available.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-cyan-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Update Available</h2>
            <p className="text-gray-400 mb-4">
              A new version of GamePath AI ({newVersion}) is available. You're currently running version {currentVersion}.
            </p>
            <button
              onClick={() => {
                // TODO: Implement update process
                console.log('Starting update...');
                onClose();
              }}
              className="px-4 py-2 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400"
            >
              Update Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};