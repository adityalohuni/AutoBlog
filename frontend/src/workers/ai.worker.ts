import { pipeline, env } from '@xenova/transformers';
import { WaveFile } from 'wavefile';
import { AVAILABLE_MODELS } from '../constants/aiModels';
import { setupCustomCache } from '../utils/modelCache';

// Configure environment for browser
env.allowLocalModels = false;
env.useBrowserCache = false; // Disable default cache, we will use our custom IndexedDB

// Initialize custom cache
setupCustomCache();

// Singleton for generators
const generators: Record<string, any> = {};

const getGenerator = async (modelKey: string, progressCallback?: (data: any) => void) => {
  const config = AVAILABLE_MODELS[modelKey] || AVAILABLE_MODELS['LaMini-Flan-T5-783M'];
  
  if (!generators[config.name]) {
    generators[config.name] = await pipeline(config.task as any, config.name, {
      progress_callback: progressCallback
    });
  }
  return { generator: generators[config.name], config };
};

const handlers: Record<string, (data: any, id: number) => Promise<any>> = {
  load: async (data, id) => {
    await getGenerator(data.model, (progress) => {
      self.postMessage({ type: 'progress', id, data: progress });
    });
    return { status: 'ready' };
  },

  generateText: async (data, _id) => {
    const { prompt, model, params } = data;
    const { generator, config } = await getGenerator(model);
    
    const defaultParams = {
      max_new_tokens: 200,
      temperature: 0.7,
      repetition_penalty: 1.2,
      ...params
    };

    const output = await generator(prompt, defaultParams);
    
    let text = '';
    if (output[0]?.generated_text) {
      text = output[0].generated_text;
    } else if (output[0]?.translation_text) {
      text = output[0].translation_text;
    } else if (typeof output[0] === 'string') {
      text = output[0];
    } else {
      text = JSON.stringify(output[0]);
    }

    if (config.type === 'causal' && text.startsWith(prompt)) {
      text = text.slice(prompt.length);
    }
    return { text: text.trim() };
  },

  generateSpeech: async (data, _id) => {
    const { text } = data;
    const { generator } = await getGenerator('speecht5-tts');
    
    // Generate speech with Kokoro
    const output = await generator(text);
    
    const wav = new WaveFile();
    wav.fromScratch(1, output.sampling_rate, '32f', output.audio);
    return { audio: wav.toBuffer() };
  },

  summarize: async (data, _id) => {
    const { text } = data;
    const { generator } = await getGenerator('distilbart-cnn-6-6');
    const input = text.substring(0, 3000);
    const output = await generator(input, { max_new_tokens: 150, min_new_tokens: 40 });
    return { summary: output[0].summary_text };
  },

  embed: async (data, _id) => {
    const { text, model } = data;
    const modelKey = model || 'all-MiniLM-L6-v2';
    const { generator } = await getGenerator(modelKey);
    
    const output = await generator(text, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);
    return { embedding };
  }
};

self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;

  try {
    const handler = handlers[type];
    if (handler) {
      const result = await handler(data, id);
      self.postMessage({ type: 'complete', id, data: result });
    } else {
      throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error: any) {
    self.postMessage({ type: 'error', id, error: error.message });
  }
});
