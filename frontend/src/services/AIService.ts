import Worker from '../workers/ai.worker.ts?worker';
import { AVAILABLE_MODELS } from '../constants/aiModels';
import { GoogleGenAI } from '@google/genai';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

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
    
    Object.keys(models).forEach(key => {
      const model = models[key];
      if (model.requiredKey) {
        const apiKey = localStorage.getItem(model.requiredKey);
        if (!apiKey) {
          delete models[key];
        }
      }
    });

    return models;
  }

  private async generateGeminiText(prompt: string, apiKey: string, systemPrompt?: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });
      
      const config: any = {};
      if (systemPrompt) {
        config.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      const model = 'gemini-2.0-flash-lite';
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      let fullText = '';
      for await (const chunk of response) {
        if (chunk.text) {
          fullText += chunk.text;
        }
      }
      return fullText;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate text with Gemini');
    }
  }

  private async generateCerebrasText(prompt: string, model: string, apiKey: string, systemPrompt?: string): Promise<string> {
    try {
      const client = new Cerebras({
        apiKey: apiKey,
      });

      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const completionCreateResponse: any = await client.chat.completions.create({
        messages: messages,
        model: model,
      });

      return completionCreateResponse.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Cerebras API Error:', error);
      throw new Error('Failed to generate text with Cerebras');
    }
  }

  public async downloadModel(model: string, onProgress?: (data: any) => void) {
    return this.postMessage('load', { model }, onProgress);
  }

  public async generateAiText(prompt: string, model: string, maxTokens: number, systemPrompt?: string): Promise<string> {
    if (model === 'gemini-2.0-flash-lite') {
      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) throw new Error('Gemini API Key not found');

      return this.generateGeminiText(prompt, apiKey, systemPrompt);
    }

    if (model === 'llama3.1-8b' || model === 'llama-3.3-70b' || model === 'gpt-oss-120b' || model === 'qwen-3-32b') {
      const apiKey = localStorage.getItem('cerebrasApiKey');
      if (!apiKey) throw new Error('Cerebras API Key not found');
      return this.generateCerebrasText(prompt, model, apiKey, systemPrompt);
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
