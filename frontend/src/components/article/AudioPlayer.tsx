import React from 'react';
import { Volume2, Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  isGeneratingAudio: boolean;
  volume: number;
  audioError: string | null;
  audioRef: React.RefObject<HTMLAudioElement>;
  onTogglePlay: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlayEnded: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isPlaying,
  isGeneratingAudio,
  volume,
  audioError,
  audioRef,
  onTogglePlay,
  onVolumeChange,
  onPlayEnded
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Volume2 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Audio Version</h3>
            <p className="text-sm text-gray-500">Listen to this article</p>
          </div>
        </div>
        {audioError && (
          <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
            {audioError}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onTogglePlay}
          disabled={isGeneratingAudio}
          className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingAudio ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-1" />
          )}
        </button>
        
        <div className="flex-1">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full bg-blue-500 transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`} style={{ width: isPlaying ? '100%' : '0%' }} />
          </div>
        </div>

        <div className="flex items-center gap-2 w-24">
          <Volume2 size={16} className="text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={onVolumeChange}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
          />
        </div>
      </div>
      
      <audio 
        ref={audioRef} 
        onEnded={onPlayEnded}
        className="hidden" 
      />
    </div>
  );
};
