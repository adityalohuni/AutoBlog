import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, Loader2, X } from 'lucide-react';
import { KOKORO_VOICES } from '../../constants/voices';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioPlayerProps {
  isPlaying: boolean;
  isGeneratingAudio: boolean;
  volume: number;
  audioError: string | null;
  audioRef: React.RefObject<HTMLAudioElement>;
  selectedVoice: string;
  onTogglePlay: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlayEnded: () => void;
  onVoiceChange: (voice: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isPlaying,
  isGeneratingAudio,
  volume,
  audioError,
  audioRef,
  selectedVoice,
  onTogglePlay,
  onVolumeChange,
  onPlayEnded,
  onVoiceChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the element is not intersecting and is above the viewport (top < 0), enable sticky
        setIsSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const PlayerControls = ({ compact = false }) => (
    <div className={`flex items-center gap-4 ${compact ? 'flex-row' : 'flex-col sm:flex-row'}`}>
      <button
        onClick={onTogglePlay}
        disabled={isGeneratingAudio}
        className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
      >
        {isGeneratingAudio ? (
          <Loader2 className="animate-spin" size={compact ? 18 : 24} />
        ) : isPlaying ? (
          <Pause size={compact ? 18 : 24} />
        ) : (
          <Play size={compact ? 18 : 24} className="ml-1" />
        )}
      </button>

      <div className={`flex-1 w-full ${compact ? 'hidden sm:block' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <Volume2 size={16} className="text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={onVolumeChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
          />
        </div>
      </div>

      {!compact && (
        <select
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value)}
          disabled={isGeneratingAudio || isPlaying}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
        >
          {KOKORO_VOICES.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <>
      <div ref={containerRef} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Audio Version</h3>
              <p className="text-sm text-gray-500">
                {isGeneratingAudio ? 'Loading voice model & generating...' : 'Listen to this article'}
              </p>
            </div>
          </div>
          {audioError && (
            <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
              {audioError}
            </span>
          )}
        </div>

        <PlayerControls />
        
        <audio
          ref={audioRef}
          onEnded={onPlayEnded}
          className="hidden"
        />
      </div>

      <AnimatePresence>
        {isSticky && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 bg-white rounded-full shadow-2xl border border-gray-100 p-2 pr-6 flex items-center gap-4"
          >
            <PlayerControls compact={true} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900">Playing Article</span>
              <span className="text-[10px] text-gray-500">
                {isGeneratingAudio ? 'Generating...' : isPlaying ? 'Now Playing' : 'Paused'}
              </span>
            </div>
            <button 
              onClick={() => setIsSticky(false)}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
