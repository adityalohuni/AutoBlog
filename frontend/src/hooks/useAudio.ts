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
  const isGeneratingAudioRef = useRef(false);
  const isPlayingRef = useRef(false);

  const updateIsPlaying = (playing: boolean) => {
    setIsPlaying(playing);
    isPlayingRef.current = playing;
  };

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
        updateIsPlaying(true);
      }
    } else if (isGeneratingAudioRef.current) {
      console.log('AudioHook: Waiting for next chunk...');
      // We are still generating, so we wait.
      // Increment index so we know we are waiting for 'nextIndex'
      currentChunkIndexRef.current = nextIndex;
    } else {
      console.log('AudioHook: All chunks finished');
      updateIsPlaying(false);
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
        updateIsPlaying(true);
      }
      return;
    }

    if (!content) {
      console.warn('AudioHook: No content');
      return;
    }

    console.log('AudioHook: Starting stream generation');
    setIsGeneratingAudio(true);
    isGeneratingAudioRef.current = true;
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
              updateIsPlaying(true);
            }
          }, 50);
          isFirst = false;
        } else if (currentChunkIndexRef.current === audioQueueRef.current.length - 1) {
          // We were waiting for this chunk
          console.log(`AudioHook: Next chunk arrived, playing chunk ${currentChunkIndexRef.current + 1}`);
          if (audioRef.current && isPlayingRef.current) {
             audioRef.current.src = url;
             audioRef.current.play().catch(e => console.error("Playback failed", e));
          }
        }
      }
      console.log('AudioHook: Stream generation complete');

    } catch (error) {
      console.error('TTS Error:', error);
      setAudioError('Failed to generate audio.');
    } finally {
      setIsGeneratingAudio(false);
      isGeneratingAudioRef.current = false;
    }
  };

  const togglePlay = () => {
    if (audioQueueRef.current.length > 0 && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      updateIsPlaying(!isPlaying);
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
      updateIsPlaying(false);
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
    setIsPlaying: updateIsPlaying,
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
