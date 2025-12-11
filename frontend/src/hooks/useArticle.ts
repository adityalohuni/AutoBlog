import { useState, useEffect } from 'react';
import { getArticle, Article } from '../api/client';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const useArticle = (id: string | undefined) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<{id: string, text: string, level: number}[]>([]);
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const data = await getArticle(id);
        setArticle(data);
      } catch (error) {
        console.error('Failed to fetch article:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  useEffect(() => {
    if (article) {
      let content = article.content;

      // 1. Process <think> tags
      content = content.replace(
        /<think>([\s\S]*?)<\/think>/g, 
        '\n```thinking\n$1\n```\n'
      );

      // 2. Convert bold lines to H2 (e.g. **Introduction**)
      content = content.replace(/^\s*(\*\*|__)(.*?)\1\s*$/gm, '\n\n## $2\n\n');

      // 3. Convert "References" or "References:" to H2
      content = content.replace(/^\s*References:?\s*$/gmi, '\n\n## References\n\n');

      // 4. Fix double headings (e.g. ## ## Title)
      content = content.replace(/^#+\s+#+\s+/gm, '## ');

      setProcessedContent(content);

      // Extract headings for TOC from the PROCESSED content
      const extractedHeadings: {id: string, text: string, level: number}[] = [];
      
      // Regex to find headings in the processed markdown
      const headingRegex = /^(#{1,3})\s+(.+)$/gm;
      let match;
      
      while ((match = headingRegex.exec(content)) !== null) {
        const text = match[2].replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\1/g, '$2');
        extractedHeadings.push({
          level: match[1].length,
          text: text,
          id: slugify(text)
        });
      }
      setHeadings(extractedHeadings);
    }
  }, [article]);

  return { article, loading, headings, processedContent };
};
