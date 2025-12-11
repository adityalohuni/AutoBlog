import { AIService } from '../../services/AIService';

export class AudioPipeline {
  private static instance: AudioPipeline;
  private aiService: AIService;

  constructor() {
    console.log('AudioPipeline: Initializing instance');
    this.aiService = AIService.getInstance();
  }

  public static getInstance(): AudioPipeline {
    if (!AudioPipeline.instance) {
      console.log('AudioPipeline: Creating new instance');
      AudioPipeline.instance = new AudioPipeline();
    }
    return AudioPipeline.instance;
  }

  async generateSpeech(text: string): Promise<Blob> {
    console.log('TTS Step 1/4: Starting generation');
    const cleanedText = this.cleanText(text);
    const normalizedText = this.normalizeText(cleanedText);
    console.log('TTS Step 2/4: Text cleaned and normalized', { originalLength: text.length, cleanedLength: cleanedText.length });
    
    // Use chunking even for single blob generation to avoid model limits
    const chunks = this.chunkText(normalizedText, 300); // 300 chars is a safe limit for SpeechT5
    console.log(`TTS Step 3/4: Text chunked into ${chunks.length} parts`);
    const audioBlobs: Blob[] = [];
    let lastError: any;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.trim()) {
        try {
          console.log(`TTS Step 3.${i+1}/4: Generating audio for chunk ${i+1}/${chunks.length}`);
          const blob = await this.aiService.generateAudio(chunk);
          audioBlobs.push(blob);
        } catch (e) {
          console.warn('Failed to generate audio for chunk:', chunk, e);
          lastError = e;
        }
      }
    }

    console.log('TTS Step 4/4: Generation complete, combining blobs');
    
    if (audioBlobs.length === 0) {
      throw lastError || new Error('No audio generated');
    }
    
    // For now, return the first chunk to avoid static noise from concatenated WAV headers
    // Ideally, the UI should use generateStreamedSpeech
    return new Blob(audioBlobs, { type: 'audio/wav' });
  }

  private normalizeText(text: string): string {
    return text
      .replace(/&/g, ' and ')
      .replace(/%/g, ' percent ')
      .replace(/\$/g, ' dollars ')
      .replace(/\+/g, ' plus ')
      .replace(/=/g, ' equals ')
      .replace(/@/g, ' at ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanText(text: string): string {
    return text
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
      .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
      .replace(/`{3}[\s\S]*?`{3}/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/^#{1,6}\s+/gm, '') // Remove headers
      .replace(/^\s*[-+*]\s+/gm, '') // Remove list bullets
      .replace(/^\s*\d+\.\s+/gm, '') // Remove list numbers
      .replace(/^\s*>\s+/gm, '') // Remove blockquotes
      .replace(/\n{2,}/g, '\n') // Normalize newlines
      .trim();
  }

  private chunkText(text: string, maxSize: number = 200): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (sentence.length > maxSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        const subParts = sentence.split(/([,;:]\s+)/);
        let currentSubPart = '';
        
        for (const part of subParts) {
          if ((currentSubPart + part).length > maxSize) {
             if (currentSubPart.trim()) chunks.push(currentSubPart.trim());
             currentSubPart = part;
          } else {
             currentSubPart += part;
          }
        }
        if (currentSubPart.trim()) {
           if (currentSubPart.length > maxSize) {
             chunks.push(currentSubPart.trim());
           } else {
             currentChunk = currentSubPart;
           }
        }
      } else if ((currentChunk + sentence).length > maxSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }

  async *generateStreamedSpeech(text: string): AsyncGenerator<Blob> {
    const cleanedText = this.cleanText(text);
    const normalizedText = this.normalizeText(cleanedText);
    const chunks = this.chunkText(normalizedText);
    for (const chunk of chunks) {
      if (chunk.trim()) {
        yield await this.aiService.generateAudio(chunk);
      }
    }
  }
}
