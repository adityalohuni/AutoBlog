import { useState } from 'react';
import { articleService } from '../services/ArticleService';

export const useArticleGenerator = (onSuccess?: () => void) => {
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (title: string, context: string, model: string) => {
    setGenerating(true);
    setStatus('Starting...');
    setData(null);
    setError(null);
    
    try {
      await articleService.generateNewArticle(
        { title, context, model },
        (stage, data) => {
          setStatus(data && typeof data === 'string' ? data : stage);
          if (stage === 'PROCESSING_CONTEXT') {
            setData(data);
          }
        }
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to generate:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to generate article';
      const details = err.response?.data?.errors?.map((e: any) => e.message).join(', ');
      setError(`${msg}${details ? ': ' + details : ''}`);
    } finally {
      setGenerating(false);
      setStatus('');
      setData(null);
    }
  };

  return { generating, status, data, error, generate };
};
