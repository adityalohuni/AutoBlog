import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const flattenText = (children: any): string => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(flattenText).join('');
  if (children?.props?.children) return flattenText(children.props.children);
  return '';
};

const ThinkingBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-6 bg-amber-50 border border-amber-100 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-amber-100/50 px-4 py-2 flex items-center justify-between text-amber-800 text-sm font-medium border-b border-amber-100 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain size={16} />
          <span>AI Thought Process</span>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 text-amber-900/80 text-sm font-mono leading-relaxed whitespace-pre-wrap border-t border-amber-100/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ArticleContentProps {
  content: string;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({ content }) => {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({children}) => {
            const id = slugify(flattenText(children));
            return <h1 id={id} className="text-3xl font-bold text-gray-900 mt-8 mb-4 scroll-mt-24">{children}</h1>;
          },
          h2: ({children}) => {
            const id = slugify(flattenText(children));
            return <h2 id={id} className="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-100 scroll-mt-24">{children}</h2>;
          },
          h3: ({children}) => {
            const id = slugify(flattenText(children));
            return <h3 id={id} className="text-xl font-bold text-gray-900 mt-6 mb-3 scroll-mt-24">{children}</h3>;
          },
          p: ({children}) => <p className="text-gray-600 leading-relaxed mb-6">{children}</p>,
          ul: ({children}) => <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-gray-600">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-gray-600">{children}</ol>,
          li: ({children}) => <li className="pl-2">{children}</li>,
          blockquote: ({children}) => (
            <blockquote className="border-l-4 border-blue-500 pl-6 py-2 my-6 bg-blue-50 rounded-r-lg italic text-gray-700">
              {children}
            </blockquote>
          ),
          code: ({className, children}) => {
            const match = /language-(\w+)/.exec(className || '');
            const isThinking = match && match[1] === 'thinking';
            
            if (isThinking) {
              return <ThinkingBlock>{children}</ThinkingBlock>;
            }
            
            return !match ? (
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ) : (
              <div className="my-6 rounded-xl overflow-hidden bg-gray-900 text-gray-100 shadow-lg">
                <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 font-mono border-b border-gray-700 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                  <span className="ml-2">{match[1]}</span>
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className={className}>{children}</code>
                </pre>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
