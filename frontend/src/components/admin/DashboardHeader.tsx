import React from 'react';
import { Settings, Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  onOpenSettings: () => void;
  onOpenGenerate: () => void;
  isGenerating: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onOpenSettings, 
  onOpenGenerate, 
  isGenerating 
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your AI-generated content</p>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={onOpenSettings}
          className="p-3 bg-white text-gray-600 rounded-full hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
          title="Settings"
        >
          <Settings size={18} />
        </button>
        <button 
          onClick={onOpenGenerate} 
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={18} />
          {isGenerating ? 'Generating...' : 'Generate New'}
        </button>
      </div>
    </div>
  );
};
