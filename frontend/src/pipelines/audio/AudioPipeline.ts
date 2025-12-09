import { AIService } from '../../services/AIService';

export class AudioPipeline {
  private aiService: AIService;

  constructor() {
    this.aiService = AIService.getInstance();
  }

  async generateSpeech(text: string): Promise<Blob> {
    return this.aiService.generateAudio(text);
  }

  private chunkText(text: string, maxSize: number = 200): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += sentence;
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }

  async *generateStreamedSpeech(text: string): AsyncGenerator<Blob> {
    const chunks = this.chunkText(text);
    for (const chunk of chunks) {
      if (chunk.trim()) {
        yield await this.aiService.generateAudio(chunk);
      }
    }
  }
}
