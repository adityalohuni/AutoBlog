import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Sparkles } from 'lucide-react';
import AiEditor from '../components/AiEditor';
import { useAuth } from '../hooks/useAuth';
import { useArticles } from '../hooks/useArticles';
import { useArticleGenerator } from '../hooks/useArticleGenerator';
import { LoginCard } from '../components/admin/LoginCard';
import { DashboardHeader } from '../components/admin/DashboardHeader';
import { ArticleList } from '../components/admin/ArticleList';
import { GenerateModal } from '../components/admin/GenerateModal';
import { DeleteModal } from '../components/admin/DeleteModal';
import { SettingsModal } from '../components/admin/SettingsModal';

const Admin: React.FC = () => {
  const { isAuthenticated, loading: authLoading, login } = useAuth();
  const { articles, loading: articlesLoading, fetchArticles, deleteArticle, updateArticle } = useArticles();
  
  // We pass fetchArticles as onSuccess to refresh the list after generation
  const { generating, status, data, error: genError, generate } = useArticleGenerator(fetchArticles);

  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Modal States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null);

  const handleDeleteClick = (id: number) => {
    setArticleToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (articleToDelete) {
      await deleteArticle(articleToDelete);
    }
    setShowDeleteModal(false);
    setArticleToDelete(null);
  };

  const handleSave = async (id: number, newContent: string) => {
    const article = articles.find(a => a.id === id);
    if (article) {
      await updateArticle(id, { ...article, content: newContent });
      setEditingId(null);
    }
  };

  const handleGenerate = async (title: string, context: string, model: string) => {
    await generate(title, context, model);
    setShowGenerateModal(false);
  };

  if (authLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );

  if (!isAuthenticated) {
    return <LoginCard onLogin={login} />;
  }

  if (articlesLoading) return (
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
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <DashboardHeader 
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenGenerate={() => setShowGenerateModal(true)}
          isGenerating={generating}
        />

        <ArticleList 
          articles={articles}
          onEdit={setEditingId}
          onDelete={handleDeleteClick}
        />
      </motion.div>

      <GenerateModal 
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerate}
        generating={generating}
        status={status}
        data={data}
        error={genError}
      />

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
};

export default Admin;
