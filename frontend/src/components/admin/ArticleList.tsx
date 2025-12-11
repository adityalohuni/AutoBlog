import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Edit2, Trash2 } from 'lucide-react';
import { Article } from '../../api/client';

interface ArticleListProps {
  articles: Article[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({ articles, onEdit, onDelete }) => {
  return (
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
              onClick={() => onEdit(article.id)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={() => onDelete(article.id)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
