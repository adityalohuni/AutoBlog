import React from 'react';
import { motion } from 'framer-motion';
import { List, ChevronDown } from 'lucide-react';

interface TableOfContentsProps {
  headings: {id: string, text: string, level: number}[];
  activeHeading: string;
  onHeadingClick: (id: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ headings, activeHeading, onHeadingClick }) => {
  if (headings.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
      <div className="flex items-center gap-2 font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
        <List size={20} className="text-blue-600" />
        <h2>Table of Contents</h2>
      </div>
      <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
        {headings.map((heading, index) => (
          <motion.button
            key={index}
            onClick={() => onHeadingClick(heading.id)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group ${
              activeHeading === heading.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            style={{ paddingLeft: `${heading.level * 0.75}rem` }}
          >
            <span className="truncate">{heading.text}</span>
            {activeHeading === heading.id && (
              <motion.div layoutId="activeIndicator">
                <ChevronDown size={14} className="-rotate-90 text-blue-500" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </nav>
    </div>
  );
};
