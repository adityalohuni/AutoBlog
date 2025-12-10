import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Volume2, Pause, Play, List, ChevronDown, Brain, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getArticle, Article as ArticleType } from '../api/client';
import { AudioPipeline } from '../pipelines/audio/AudioPipeline';

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

const Article: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [volume, setVolume] = useState(1);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  
  const [headings, setHeadings] = useState<{id: string, text: string, level: number}[]>([]);
  const [processedContent, setProcessedContent] = useState('');
  const [activeHeading, setActiveHeading] = useState<string>('');

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
    
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [id]);

  useEffect(() => {
    if (article) {
      let content = article.content;

      // 1. Process <think> tags
      content = content.replace(
        /<think>([\s\S]*?)<\/think>/g, 
        '\n```thinking\n$1\n```\n'
      );

      // 2. Convert bold lines to H2 (e.g. **Introduction**)
      content = content.replace(/^\s*(\*\*|__)(.*?)\1\s*$/gm, '\n\n## $2\n\n');

      // 3. Convert "References" or "References:" to H2
      content = content.replace(/^\s*References:?\s*$/gmi, '\n\n## References\n\n');

      setProcessedContent(content);

      // Extract headings for TOC from the PROCESSED content
      const extractedHeadings: {id: string, text: string, level: number}[] = [];
      
      // Regex to find headings in the processed markdown
      const headingRegex = /^(#{1,3})\s+(.+)$/gm;
      let match;
      
      while ((match = headingRegex.exec(content)) !== null) {
        const text = match[2].replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\1/g, '$2');
        extractedHeadings.push({
          level: match[1].length,
          text: text,
          id: slugify(text)
        });
      }
      setHeadings(extractedHeadings);
    }
  }, [article]);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveHeading(headings[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

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
    setAudioError(null);
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
      setAudioError('Failed to generate audio. Please try again later.');
      setIsPlaying(false);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleAudioEnded = () => {
    playNextChunk();
  };

  const MarkdownComponents = {
    h1: ({children, ...props}: any) => {
      const text = flattenText(children);
      const id = slugify(text);
      return (
        <h1 id={id} className="text-4xl font-bold mt-12 mb-6 text-gray-900 leading-tight tracking-tight border-b border-gray-100 pb-4" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({children, ...props}: any) => {
      const text = flattenText(children);
      const id = slugify(text);
      return (
        <h2 id={id} className="text-3xl font-bold mt-10 mb-5 text-gray-800 leading-snug" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({children, ...props}: any) => {
      const text = flattenText(children);
      const id = slugify(text);
      return (
        <h3 id={id} className="text-2xl font-bold mt-8 mb-4 text-gray-800" {...props}>
          {children}
        </h3>
      );
    },
    code: ({node, inline, className, children, ...props}: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const isThinking = match && match[1] === 'thinking';
      
      if (isThinking) {
        return (
          <details className="my-6 bg-blue-50/50 rounded-xl border border-blue-100 overflow-hidden group">
            <summary className="px-5 py-3 bg-blue-50/80 cursor-pointer font-medium text-blue-900 flex items-center gap-3 select-none hover:bg-blue-100 transition-colors list-none">
              <div className="flex items-center gap-2 flex-1">
                <Brain size={18} className="text-blue-600" />
                <span>AI Thought Process</span>
              </div>
              <ChevronDown size={18} className="text-blue-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-5 text-sm text-blue-800/80 font-mono whitespace-pre-wrap leading-relaxed border-t border-blue-100/50 bg-white/50">
              {String(children).replace(/\n$/, '')}
            </div>
          </details>
        );
      }
      
      return !inline ? (
        <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto my-6 shadow-sm border border-gray-800">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono font-medium" {...props}>
          {children}
        </code>
      );
    }
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors group">
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Articles
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Table of Contents */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-8 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-4">
              <List size={20} />
              <span>Table of Contents</span>
            </div>
            <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-4 custom-scrollbar">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={`py-1.5 text-sm transition-colors border-l-2 pl-4 flex items-center gap-2 ${
                    activeHeading === heading.id
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
                  style={{ marginLeft: `${(heading.level - 1) * 12}px` }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                    setActiveHeading(heading.id);
                  }}
                >
                  {heading.text === 'References' && <BookOpen size={14} />}
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9">
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

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-8 flex-wrap gap-4">
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
                    {audioError ? (
                      <p className="text-sm text-red-500">{audioError}</p>
                    ) : (
                      <p className="text-sm text-gray-500">AI-generated audio</p>
                    )}
                  </div>
                </div>
                
                {audioUrl && !audioError && (
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

              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-serif">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={MarkdownComponents}
                >
                  {processedContent}
                </ReactMarkdown>
              </div>
            </div>
          </article>
        </main>
      </div>
    </motion.div>
  );
};

export default Article;
