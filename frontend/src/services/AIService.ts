import Worker from '../workers/ai.worker.ts?worker';
import { AVAILABLE_MODELS } from '../constants/aiModels';
import axios from 'axios';
import { getPrompts } from '../api/client';

interface WorkerMessage {
  type: string;
  id: number;
  data?: any;
  error?: string;
}

interface Callback {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  onProgress?: (data: any) => void;
}

export class AIService {
  private static instance: AIService;
  private worker: Worker;
  private callbacks: { [key: number]: Callback } = {};
  private nextId = 0;

  private constructor() {
    this.worker = new Worker();
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private handleWorkerMessage(event: MessageEvent<WorkerMessage>) {
    const { type, id, data, error } = event.data;
    if (this.callbacks[id]) {
      if (type === 'complete') {
        this.callbacks[id].resolve(data);
        delete this.callbacks[id];
      } else if (type === 'error') {
        this.callbacks[id].reject(new Error(error));
        delete this.callbacks[id];
      } else if (type === 'progress') {
        if (this.callbacks[id].onProgress) {
          this.callbacks[id].onProgress!(data);
        }
      }
    }
  }

  private postMessage(type: string, data: any, onProgress?: (data: any) => void): Promise<any> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.callbacks[id] = { resolve, reject, onProgress };
      this.worker.postMessage({ type, id, data });
    });
  }

  public async getAiModels() {
    const models = { ...AVAILABLE_MODELS };
    const geminiKey = localStorage.getItem('geminiApiKey');
    if (!geminiKey) {
      delete (models as any)['gemini-pro'];
    }
    return models;
  }

  private async generateGeminiText(prompt: string, apiKey: string): Promise<string> {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        }
      );
      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate text with Gemini');
    }
  }

  public async downloadModel(model: string, onProgress?: (data: any) => void) {
    return this.postMessage('load', { model }, onProgress);
  }

  public async generateAiText(prompt: string, model: string, maxTokens: number): Promise<string> {
    if (model === 'gemini-pro') {
      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) throw new Error('Gemini API Key not found');
      
      // Fetch prompts from backend
      try {
        const templates = await getPrompts();
        // Use templates if needed, for now we just log them to show they are fetched
        console.log('Fetched templates:', templates);
      } catch (e) {
        console.warn('Failed to fetch templates', e);
      }

      return this.generateGeminiText(prompt, apiKey);
    }
    const result = await this.postMessage('generateText', { prompt, model, params: { max_new_tokens: maxTokens } });
    return result.text;
  }

  public async generateAudio(text: string): Promise<Blob> {
    const result = await this.postMessage('generateSpeech', { text });
    return new Blob([result.audio], { type: 'audio/wav' });
  }

  public async generateEmbedding(text: string, model: string = 'all-MiniLM-L6-v2'): Promise<number[]> {
    const result = await this.postMessage('embed', { text, model });
    return result.embedding;
  }
}
