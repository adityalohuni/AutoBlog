import { AIService } from '../../services/AIService';

export class AudioPipeline {
  private aiService: AIService;

  constructor() {
    this.aiService = AIService.getInstance();
  }

  async generateSpeech(text: string): Promise<Blob> {
    return this.aiService.generateAudio(text);
  }
}
