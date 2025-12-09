import React, { useState, useEffect } from 'react';
import { Save, X, Download, Wand2, Type, Cpu } from 'lucide-react';
import { getPrompts } from '../api/client';
import { AIService } from '../services/AIService';

interface AiEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

interface AiModel {
  name: string;
  task: string;
}

const AiEditor: React.FC<AiEditorProps> = ({ initialContent, onSave, onCancel }) => {
  const [content, setContent] = useState(initialContent || '');
  const [models, setModels] = useState<{ [key: string]: AiModel }>({});
  const [selectedModel, setSelectedModel] = useState('LaMini-Flan-T5-783M');
  const [aiLoading, setAiLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<any>(null);
  const [templates, setTemplates] = useState<any>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await AIService.getInstance().getAiModels();
        setModels(data);
        if (data && Object.keys(data).length > 0 && !data[selectedModel]) {
            setSelectedModel(Object.keys(data)[0]);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };
    const fetchTemplates = async () => {
      try {
        const data = await getPrompts();
        setTemplates(data);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    };
    fetchModels();
    fetchTemplates();
  }, []);

  const handleDownloadModel = async () => {
    if (!selectedModel) return;
    setDownloading(true);
    setDownloadProgress(null);
    try {
      await AIService.getInstance().downloadModel(selectedModel, (progress: any) => {
          setDownloadProgress(progress);
      });
      alert(`Model ${selectedModel} downloaded/preloaded successfully!`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download model.');
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleAiGenerate = async (type: 'complete' | 'paragraph') => {
    setAiLoading(true);
    try {
      let prompt = '';
      let maxTokens = 100;

      if (type === 'complete') {
        const text = content.slice(-200);
        if (templates?.continuation?.user_template) {
          prompt = templates.continuation.user_template.replace('{text}', text);
        } else {
          prompt = text;
        }
        maxTokens = 50;
      } else if (type === 'paragraph') {
        const topic = content.split('\n').pop() || content;
        if (templates?.paragraph_generation?.user_template) {
          prompt = templates.paragraph_generation.user_template.replace('{topic}', topic);
        } else {
          prompt = "Write a paragraph about: " + topic;
        }
        maxTokens = 150;
      }

      const text = await AIService.getInstance().generateAiText(prompt, selectedModel, maxTokens);
      
      if (type === 'complete') {
        setContent(prev => prev + text);
      } else {
        setContent(prev => prev + '\n\n' + text);
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
      alert('AI Generation failed. Check console.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[600px]">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <Cpu size={16} className="text-gray-500" />
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-48"
            >
              {Object.keys(models).map(key => (
                <option key={key} value={key}>{models[key].name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleDownloadModel} 
            disabled={downloading || aiLoading}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 relative"
            title="Download/Preload Model"
          >
            <Download size={18} className={downloading ? 'animate-bounce' : ''} />
            {downloadProgress && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1 rounded-full">
                    {Math.round(downloadProgress.progress || 0)}%
                </span>
            )}
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleAiGenerate('complete')} 
              disabled={aiLoading || downloading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
            >
              <Type size={16} className="text-purple-500" />
              Complete
            </button>
            <button 
              onClick={() => handleAiGenerate('paragraph')} 
              disabled={aiLoading || downloading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
            >
              <Wand2 size={16} className="text-blue-500" />
              Paragraph
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
          <button 
            onClick={() => onSave(content)} 
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Save size={18} />
            Save
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-8 resize-none outline-none font-serif text-lg leading-relaxed text-gray-800"
          placeholder="Start writing or use AI to generate content..."
        />
        {aiLoading && (
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-2 text-sm font-medium text-blue-600 animate-pulse">
            <Wand2 size={16} />
            AI is writing...
          </div>
        )}
      </div>
    </div>
  );
};

export default AiEditor;
