import { useState, useEffect, useCallback } from 'react';
import { getArticles, deleteArticle as apiDeleteArticle, updateArticle as apiUpdateArticle, Article } from '../api/client';

export const useArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getArticles();
      setArticles(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setError('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const deleteArticle = async (id: number) => {
    try {
      await apiDeleteArticle(id.toString());
      await fetchArticles();
    } catch (err) {
      console.error('Failed to delete:', err);
      throw err;
    }
  };

  const updateArticle = async (id: number, article: Partial<Article>) => {
    try {
      // We need the full article object for the update, but the API might accept partial.
      // Assuming we pass the full object or what's needed.
      // The current implementation in Admin.tsx passes { ...article, content: newContent }
      await apiUpdateArticle(id.toString(), article as any); 
      await fetchArticles();
    } catch (err) {
      console.error('Failed to save:', err);
      throw err;
    }
  };

  return { articles, loading, error, fetchArticles, deleteArticle, updateArticle };
};
