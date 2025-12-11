import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { AIService } from '../../services/AIService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('geminiApiKey') || '');
  const [cerebrasKey, setCerebrasKey] = useState(localStorage.getItem('cerebrasApiKey') || '');
  const [defaultModel, setDefaultModel] = useState(localStorage.getItem('defaultModel') || 'LaMini-Flan-T5-783M');
  const [availableModels, setAvailableModels] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      AIService.getInstance().getAiModels().then(setAvailableModels).catch(console.error);
    }
  }, [isOpen]);

  const handleSaveSettings = () => {
    localStorage.setItem('geminiApiKey', geminiKey);
    localStorage.setItem('cerebrasApiKey', cerebrasKey);
    localStorage.setItem('defaultModel', defaultModel);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="text-gray-600" size={20} />
                Settings
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gemini API Key</label>
                <input 
                  type="password" 
                  value={geminiKey} 
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter your Google Gemini API Key"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Required for Gemini Pro model.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cerebras API Key</label>
                <input 
                  type="password" 
                  value={cerebrasKey} 
                  onChange={(e) => setCerebrasKey(e.target.value)}
                  placeholder="Enter your Cerebras API Key"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Required for Cerebras models.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Model</label>
                <select 
                  value={defaultModel} 
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
                >
                  {Object.keys(availableModels).map(key => (
                    <option key={key} value={key}>{availableModels[key].name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
