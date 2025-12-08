import axios from 'axios';
import { AIService } from '../services/AIService';

export interface Article {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_URL,
});

export const getArticles = async (): Promise<Article[]> => {
  const response = await client.get('/articles');
  return response.data;
};

export const getArticle = async (id: string): Promise<Article> => {
  const response = await client.get(`/articles/${id}`);
  return response.data;
};

export const updateArticle = async (id: string, data: Partial<Article>): Promise<Article> => {
  const response = await client.put(`/articles/${id}`, data);
  return response.data;
};

export const deleteArticle = async (id: string): Promise<void> => {
  await client.delete(`/articles/${id}`);
};

export const createArticle = async (data: Omit<Article, 'id' | 'created_at'>): Promise<Article> => {
  const response = await client.post('/articles', data);
  return response.data;
};

export const getPrompts = async (): Promise<any> => {
  const response = await client.get('/prompts');
  return response.data;
};

const aiService = AIService.getInstance();

export const generateNewArticle = async (params: { title: string, context: string, model: string }) => {
  const articleData = await aiService.generateArticle(params.title, params.context, params.model);
  return createArticle(articleData);
};

export const getAiModels = async () => {
  return aiService.getAiModels();
};

export const downloadModel = async (model: string, onProgress?: (data: any) => void) => {
  return aiService.downloadModel(model, onProgress);
};

export const generateAiText = async (prompt: string, model: string, maxTokens: number) => {
  const text = await aiService.generateAiText(prompt, model, maxTokens);
  return { text };
};

export const generateAiAudio = async (text: string) => {
  return aiService.generateAudio(text);
};
