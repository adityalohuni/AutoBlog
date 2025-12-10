import axios from 'axios';

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

export const setAuthCredentials = (username: string, password: string) => {
  const token = btoa(`${username}:${password}`);
  client.defaults.headers.common['Authorization'] = `Basic ${token}`;
};

export const login = async (username: string, password: string): Promise<void> => {
  await client.post('/auth/login', { username, password });
};

export const clearAuthCredentials = () => {
  delete client.defaults.headers.common['Authorization'];
};

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

