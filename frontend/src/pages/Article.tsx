import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { useArticle } from '../hooks/useArticle';
import { useAudio } from '../hooks/useAudio';
import { TableOfContents } from '../components/article/TableOfContents';
import { AudioPlayer } from '../components/article/AudioPlayer';
import { ArticleContent } from '../components/article/ArticleContent';

const Article: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { article, loading, headings, processedContent } = useArticle(id);
  const { 
    isPlaying, 
    isGeneratingAudio, 
    volume, 
    audioError, 
    audioRef, 
    selectedVoice,
    togglePlay, 
    handleVolumeChange,
    handleAudioEnded,
    handleVoiceChange
  } = useAudio(article?.content);

  const [activeHeading, setActiveHeading] = useState<string>('');

  const handleHeadingClick = (id: string) => {
    setActiveHeading(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );

  if (!article) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900">Article not found</h2>
      <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Return Home</Link>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <Link 
        to="/" 
        className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Articles
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>
            
            <div className="flex items-center gap-6 text-gray-500 border-b border-gray-100 pb-8">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>{new Date(article.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>{Math.ceil(article.content.split(' ').length / 200)} min read</span>
              </div>
            </div>
          </motion.div>

          <AudioPlayer 
            isPlaying={isPlaying}
            isGeneratingAudio={isGeneratingAudio}
            volume={volume}
            audioError={audioError}
            audioRef={audioRef}
            selectedVoice={selectedVoice}
            onTogglePlay={togglePlay}
            onVolumeChange={handleVolumeChange}
            onPlayEnded={handleAudioEnded}
            onVoiceChange={handleVoiceChange}
          />

          <ArticleContent content={processedContent} />
        </div>

        <div className="hidden lg:block lg:col-span-4">
          <TableOfContents 
            headings={headings} 
            activeHeading={activeHeading} 
            onHeadingClick={handleHeadingClick} 
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Article;
