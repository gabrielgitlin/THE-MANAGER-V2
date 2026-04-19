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
      <div className="shadow-xl w-full max-w-md overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderRadius: 0 }}>
        <div className="p-6">
          <h2 className="text-xl font-medium mb-4" style={{ color: 'var(--t1)' }}>Choose your AI assistant</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--t2)' }}>
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
              <div className="p-3" style={{ backgroundColor: 'var(--surface-2)' }}>
                <Bot className="w-6 h-6" style={{ color: 'var(--brand-1)' }} />
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--t1)' }}>AI Manager</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>
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
              <div className="p-3" style={{ backgroundColor: 'var(--surface-2)' }}>
                <Bot className="w-6 h-6" style={{ color: 'var(--brand-1)' }} />
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--t1)' }}>AI Mentor</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>
                  General knowledge assistant powered by OpenAI
                </p>
              </div>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 flex justify-end" style={{ backgroundColor: 'var(--surface-2)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border"
            style={{ color: 'var(--t1)', backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 0 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}