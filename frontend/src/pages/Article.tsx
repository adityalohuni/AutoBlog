import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Volume2, Pause, Play } from 'lucide-react';
import { getArticle, Article as ArticleType } from '../api/client';
import { AudioPipeline } from '../pipelines/audio/AudioPipeline';

const Article: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioQueueRef = useRef<string[]>([]);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const data = await getArticle(id);
        setArticle(data);
      } catch (error) {
        console.error('Failed to fetch article:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
    
    // Cleanup audio URL on unmount
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioUrl && isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Play failed", e));
    }
  }, [audioUrl, isPlaying]);

  const playNextChunk = () => {
    if (audioQueueRef.current.length > 0) {
      const nextUrl = audioQueueRef.current.shift();
      if (nextUrl) {
        setAudioUrl(nextUrl);
      }
    } else {
      if (!isGeneratingAudio) {
        setIsPlaying(false);
        setAudioUrl(null);
      }
    }
  };

  const handlePlayAudio = async () => {
    if (audioUrl) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
      return;
    }

    if (!article) return;

    setIsGeneratingAudio(true);
    setIsPlaying(true);
    audioQueueRef.current = [];

    try {
      const audioPipeline = new AudioPipeline();
      const stream = audioPipeline.generateStreamedSpeech(article.content);
      
      for await (const blob of stream) {
        const url = URL.createObjectURL(blob);
        audioQueueRef.current.push(url);
        
        if (!audioRef.current?.src || audioRef.current.ended || audioRef.current.paused) {
           // If we are not playing, try to play next chunk
           // But we need to be careful not to interrupt if it's just paused by user?
           // If isPlaying is true, we should be playing.
           if (isPlaying && (!audioRef.current?.src || audioRef.current.ended)) {
               playNextChunk();
           }
        }
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
      alert('Failed to generate audio. Check backend logs.');
      setIsPlaying(false);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleAudioEnded = () => {
    playNextChunk();
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
  
  if (!article) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-gray-700">Article not found</h2>
      <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Return Home</Link>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto"
    >
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors group">
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Articles
      </Link>

      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              {new Date(article.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {Math.ceil(article.content.split(' ').length / 200)} min read
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayAudio}
                disabled={isGeneratingAudio}
                className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isGeneratingAudio ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause size={20} />
                ) : (
                  <Play size={20} className="ml-1" />
                )}
              </button>
              <div>
                <p className="font-medium text-gray-900">Listen to article</p>
                <p className="text-sm text-gray-500">AI-generated audio</p>
              </div>
            </div>
            
            {audioUrl && (
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
            
            <audio
              ref={audioRef}
              src={audioUrl || undefined}
              onEnded={handleAudioEnded}
              className="hidden"
            />
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap font-serif">
            {article.content}
          </div>
        </div>
      </article>
    </motion.div>
  );
};

export default Article;
