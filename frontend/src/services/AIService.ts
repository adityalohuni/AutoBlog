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

  public async generateArticle(title: string, context: string, model: string): Promise<{ title: string, content: string }> {
    let prompt = '';
    try {
      const templates = await getPrompts();
      if (templates?.blog_generation?.user_template) {
        prompt = templates.blog_generation.user_template.replace('{topic}', context);
      } else {
        prompt = `Write a blog post about ${context}. Include a catchy title and clear headings.`;
      }
    } catch (e) {
      console.warn('Failed to fetch templates', e);
      prompt = `Write a blog post about ${context}. Include a catchy title and clear headings.`;
    }

    const content = await this.generateAiText(prompt, model, 1000);
    
    // Simple parsing to extract title if generated, or use provided title
    let finalTitle = title;
    let finalContent = content;

    // If title is empty, try to extract from first line if it looks like a title
    if (!finalTitle) {
      const lines = content.split('\n');
      if (lines.length > 0 && lines[0].length < 100) {
        finalTitle = lines[0].replace(/^#\s*/, '').trim();
        finalContent = lines.slice(1).join('\n').trim();
      } else {
        finalTitle = 'Untitled Article';
      }
    }

    return { title: finalTitle, content: finalContent };
  }

  public async generateAudio(text: string): Promise<Blob> {
    const result = await this.postMessage('generateSpeech', { text });
    return new Blob([result.audio], { type: 'audio/wav' });
  }
}
