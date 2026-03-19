import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

interface AISelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAIManager: () => void;
  onSelectAIMentor: () => void;
}

export default function AISelectionDialog({
  isOpen,
  onClose,
  onSelectAIManager,
  onSelectAIMentor
}: AISelectionDialogProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Choose your AI assistant</h2>
          <p className="text-sm text-gray-500 mb-6">
            Select which AI assistant you'd like to chat with
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                onSelectAIManager();
                onClose();
              }}
              className="w-full flex items-start gap-4 p-4 text-left border rounded-lg hover:border-primary hover:bg-beige transition-colors"
            >
              <div className="p-3 bg-beige rounded-lg">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI Manager</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Platform assistant that can help you navigate and use THE MANAGER
                </p>
              </div>
            </button>
            
            <button
              onClick={() => {
                onSelectAIMentor();
                onClose();
              }}
              className="w-full flex items-start gap-4 p-4 text-left border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI Mentor</h3>
                <p className="text-sm text-gray-500 mt-1">
                  General knowledge assistant powered by OpenAI
                </p>
              </div>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}