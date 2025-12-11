export interface AIModelConfig {
  name: string;
  task: string;
  type: string;
  description: string;
  requiredKey?: string;
}

export const AVAILABLE_MODELS: Record<string, AIModelConfig> = {
  'LaMini-Flan-T5-783M': {
    name: 'Xenova/LaMini-Flan-T5-783M',
    task: 'text2text-generation',
    type: 'seq2seq',
    description: 'High quality instruction following (Recommended)'
  },
  'Qwen1.5-0.5B-Chat': {
    name: 'Xenova/Qwen1.5-0.5B-Chat',
    task: 'text-generation',
    type: 'causal',
    description: 'Modern chat model, good reasoning'
  },
  'distilbart-cnn-6-6': {
    name: 'Xenova/distilbart-cnn-6-6',
    task: 'summarization',
    type: 'seq2seq',
    description: 'Summarization model'
  },
    'speecht5-tts': {
    name: 'Xenova/speecht5_tts',
    task: 'text-to-speech',
    type: 'tts',
    description: 'Microsoft SpeechT5 TTS'
  },
  'whisper-tiny': {
    name: 'Xenova/whisper-tiny',
    task: 'automatic-speech-recognition',
    type: 'asr',
    description: 'Audio transcription (ASR)'
  },
  'all-MiniLM-L6-v2': {
    name: 'Xenova/all-MiniLM-L6-v2',
    task: 'feature-extraction',
    type: 'feature-extraction',
    description: 'Semantic Search / Embeddings'
  },
  'vit-base-patch16-224': {
    name: 'Xenova/vit-base-patch16-224',
    task: 'image-classification',
    type: 'vision',
    description: 'Image Classification'
  },
  'distilbert-sentiment': {
    name: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    task: 'text-classification',
    type: 'classification',
    description: 'Sentiment Analysis'
  },
  'nllb-200-distilled-600M': {
    name: 'Xenova/nllb-200-distilled-600M',
    task: 'translation',
    type: 'seq2seq',
    description: 'Translation (Multi-lingual)'
  },
  'gemini-2.0-flash-lite': {
    name: 'Google Gemini 2.0 Flash Lite',
    task: 'text-generation',
    type: 'api',
    description: 'Google Gemini 2.0 Flash Lite API',
    requiredKey: 'geminiApiKey'
  },
  'llama3.1-8b': {
    name: 'Cerebras Llama 3.1 8B',
    task: 'text-generation',
    type: 'api',
    description: 'Cerebras Inference Llama 3.1 8B',
    requiredKey: 'cerebrasApiKey'
  },
  'llama-3.3-70b': {
    name: 'Cerebras Llama 3.3 70B',
    task: 'text-generation',
    type: 'api',
    description: 'Cerebras Inference Llama 3.3 70B',
    requiredKey: 'cerebrasApiKey'
  },
  'gpt-oss-120b': {
    name: 'OpenAI GPT OSS',
    task: 'text-generation',
    type: 'api',
    description: 'Cerebras Inference OpenAI GPT OSS 120B',
    requiredKey: 'cerebrasApiKey'
  },
  'qwen-3-32b': {
    name: 'Qwen 3 32B',
    task: 'text-generation',
    type: 'api',
    description: 'Cerebras Inference Qwen 3 32B',
    requiredKey: 'cerebrasApiKey'
  }
};
