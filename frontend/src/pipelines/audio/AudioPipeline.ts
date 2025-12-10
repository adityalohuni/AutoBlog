import { AIService } from '../../services/AIService';

export class AudioPipeline {
  private aiService: AIService;

  constructor() {
    this.aiService = AIService.getInstance();
  }

  async generateSpeech(text: string): Promise<Blob> {
    const cleanedText = this.cleanText(text);
    const normalizedText = this.normalizeText(cleanedText);
    return this.aiService.generateAudio(normalizedText);
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
