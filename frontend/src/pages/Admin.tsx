import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Sparkles, FileText, Settings } from 'lucide-react';
import { getArticles, deleteArticle, updateArticle } from '../api/client';
import { AIService } from '../services/AIService';
import { articleService } from '../services/ArticleService';
import AiEditor from '../components/AiEditor';

interface Article {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

const Admin: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  
  // Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('geminiApiKey') || '');
  const [defaultModel, setDefaultModel] = useState(localStorage.getItem('defaultModel') || 'LaMini-Flan-T5-783M');

  // Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genTitle, setGenTitle] = useState('');
  const [genContext, setGenContext] = useState('');
  const [genModel, setGenModel] = useState(defaultModel);
  const [availableModels, setAvailableModels] = useState<any>({});

  const handleSaveSettings = () => {
    localStorage.setItem('geminiApiKey', geminiKey);
    localStorage.setItem('defaultModel', defaultModel);
    setGenModel(defaultModel);
    setShowSettingsModal(false);
    AIService.getInstance().getAiModels().then(setAvailableModels).catch(console.error);
  };

  const fetchArticles = async () => {
    try {
      const data = await getArticles();
      setArticles(data);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    AIService.getInstance().getAiModels().then(setAvailableModels).catch(console.error);
  }, []);

  const handleDelete = async (id: any) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteArticle(id);
        fetchArticles();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const handleGenerateSubmit = async () => {
    setGenerating(true);
    try {
      await articleService.generateNewArticle({ title: genTitle, context: genContext, model: genModel });
      setShowGenerateModal(false);
      setGenTitle('');
      setGenContext('');
      fetchArticles();
    } catch (error: any) {
      console.error('Failed to generate:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to generate article';
      const details = error.response?.data?.errors?.map((e: any) => e.message).join(', ');
      alert(`${msg}${details ? ': ' + details : ''}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (id: number, newContent: string) => {
    try {
      const article = articles.find(a => a.id === id);
      if (article) {
        await updateArticle(id.toString(), { ...article, content: newContent });
        setEditingId(null);
        fetchArticles();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );

  if (editingId) {
    const article = articles.find(a => a.id === editingId);
    if (article) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Editing: {article.title}</h1>
          </div>
          <AiEditor 
            initialContent={article.content} 
            onSave={(content) => handleSave(article.id, content)}
            onCancel={() => setEditingId(null)}
          />
        </motion.div>
      );
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your AI-generated content</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-3 bg-white text-gray-600 rounded-full hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={() => setShowGenerateModal(true)} 
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={18} />
            {generating ? 'Generating...' : 'Generate New'}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {articles.map((article) => (
          <motion.div 
            key={article.id}
            layoutId={article.id.toString()}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{article.title}</h3>
                <p className="text-sm text-gray-500">{new Date(article.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setEditingId(article.id)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(article.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showGenerateModal && (
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
                <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
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
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateSubmit}
                  disabled={generating}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsModal && (
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
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
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
                  onClick={() => setShowSettingsModal(false)}
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
    </motion.div>
  );
};

export default Admin;
