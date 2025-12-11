import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { AIService } from '../../services/AIService';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (title: string, context: string, model: string) => Promise<void>;
  generating: boolean;
  status: string;
  data: any;
  error: string | null;
}

export const GenerateModal: React.FC<GenerateModalProps> = ({ 
  isOpen, 
  onClose, 
  onGenerate, 
  generating, 
  status, 
  data, 
  error 
}) => {
  const [genTitle, setGenTitle] = useState('');
  const [genContext, setGenContext] = useState('');
  const [genModel, setGenModel] = useState(localStorage.getItem('defaultModel') || 'LaMini-Flan-T5-783M');
  const [availableModels, setAvailableModels] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      AIService.getInstance().getAiModels().then(setAvailableModels).catch(console.error);
    }
  }, [isOpen]);

  const handleGenerateSubmit = async () => {
    await onGenerate(genTitle, genContext, genModel);
    // Reset fields if successful? The parent handles closing, so maybe we reset on close or success.
    // For now, let's just call the prop.
  };

  // Reset fields when modal opens/closes if needed, but maybe better to keep state if user accidentally closes.
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-blue-600" size={20} />
                Generate Article
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                  <div className="mt-0.5">⚠️</div>
                  <div>{error}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
                <input 
                  type="text" 
                  value={genTitle} 
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="Enter a title..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Context / Prompt</label>
                <textarea 
                  value={genContext} 
                  onChange={(e) => setGenContext(e.target.value)}
                  placeholder="What should this article be about?"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
                <select 
                  value={genModel} 
                  onChange={(e) => setGenModel(e.target.value)}
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
                disabled={generating}
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerateSubmit}
                disabled={generating}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate
                  </>
                )}
              </button>
            </div>
            {generating && (
              <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="font-medium">{status}</span>
                  </div>
                  
                  {data && (
                    <div className="relative h-24 bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="absolute inset-0 p-3 text-xs text-gray-500 font-mono leading-relaxed opacity-70">
                        <motion.div
                          animate={{ y: [0, -100] }}
                          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        >
                          {Array.isArray(data) ? data.join('\n\n') : JSON.stringify(data, null, 2)}
                        </motion.div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" />
                    </div>
                  )}

                  {status === 'GENERATING' && (
                    <div className="h-16 flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-blue-500 rounded-full"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
