import { useState, useRef, useEffect } from 'react';
import { AudioPipeline } from '../pipelines/audio/AudioPipeline';

export const useAudio = (content: string | undefined) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [volume, setVolume] = useState(1);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('af_heart');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef(0);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      audioQueueRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleAudioEnded = () => {
    const nextIndex = currentChunkIndexRef.current + 1;
    if (nextIndex < audioQueueRef.current.length) {
      console.log(`AudioHook: Playing chunk ${nextIndex + 1}/${audioQueueRef.current.length}`);
      currentChunkIndexRef.current = nextIndex;
      if (audioRef.current) {
        audioRef.current.src = audioQueueRef.current[nextIndex];
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      console.log('AudioHook: All chunks finished');
      setIsPlaying(false);
      currentChunkIndexRef.current = 0;
      // Reset to first chunk so user can replay
      if (audioRef.current && audioQueueRef.current.length > 0) {
        audioRef.current.src = audioQueueRef.current[0];
      }
    }
  };

  const handlePlayAudio = async () => {
    if (audioQueueRef.current.length > 0 && !isGeneratingAudio) {
      // If we have content in queue, just play
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    if (!content) {
      console.warn('AudioHook: No content');
      return;
    }

    console.log('AudioHook: Starting stream generation');
    setIsGeneratingAudio(true);
    setAudioError(null);
    
    // Reset state
    audioQueueRef.current.forEach(url => URL.revokeObjectURL(url));
    audioQueueRef.current = [];
    currentChunkIndexRef.current = 0;
    setAudioUrl(null);

    try {
      const cleanText = content
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/[#*`_\[\]]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      if (!cleanText) {
        setAudioError('Content is empty');
        return;
      }

      const generator = AudioPipeline.getInstance().generateStreamedSpeech(cleanText, selectedVoice);
      
      let isFirst = true;
      for await (const blob of generator) {
        const url = URL.createObjectURL(blob);
        audioQueueRef.current.push(url);
        
        if (isFirst) {
          console.log('AudioHook: First chunk received, starting playback');
          setAudioUrl(url); // Triggers UI to show controls
          
          // Small timeout to ensure audio element is mounted/updated
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.src = url;
              audioRef.current.play();
              setIsPlaying(true);
            }
          }, 50);
          isFirst = false;
        }
      }
      console.log('AudioHook: Stream generation complete');

    } catch (error) {
      console.error('TTS Error:', error);
      setAudioError('Failed to generate audio.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const togglePlay = () => {
    if (audioQueueRef.current.length > 0 && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      handlePlayAudio();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice);
    // Reset audio state so it regenerates with new voice on next play
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
    // Clear queue to force regeneration
    audioQueueRef.current.forEach(url => URL.revokeObjectURL(url));
    audioQueueRef.current = [];
    currentChunkIndexRef.current = 0;
    setAudioUrl(null);
  };

  return {
    audioUrl,
    isPlaying,
    setIsPlaying,
    isGeneratingAudio,
    volume,
    audioError,
    audioRef,
    selectedVoice,
    handlePlayAudio,
    togglePlay,
    handleVolumeChange,
    handleAudioEnded,
    handleVoiceChange
  };
};
