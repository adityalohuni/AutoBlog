import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Article } from '../../api/client';

interface ArticleCardProps {
  article: Article;
  index: number;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, index }) => {
  return (
    <Link to={`/article/${article.id}`} className="group">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col"
      >
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Calendar size={14} />
          <span>{new Date(article.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {article.title}
        </h2>
        
        <div className="text-gray-600 leading-relaxed mb-6 flex-grow prose prose-sm max-w-none line-clamp-3">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Strip headings for preview
              h1: ({children}) => <p className="font-bold">{children}</p>,
              h2: ({children}) => <p className="font-bold">{children}</p>,
              h3: ({children}) => <p className="font-bold">{children}</p>,
              // Hide thinking blocks in preview
              code: ({className, children}) => {
                const match = /language-(\w+)/.exec(className || '');
                return match && match[1] === 'thinking' ? null : <code>{children}</code>;
              }
            }}
          >
            {article.content.replace(/<think>[\s\S]*?<\/think>/g, '')}
          </ReactMarkdown>
        </div>
        
        <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
          Read Article <ArrowRight size={16} className="ml-2" />
        </div>
      </motion.div>
    </Link>
  );
};
