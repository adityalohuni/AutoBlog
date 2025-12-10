import { AIService } from '../../services/AIService';
import { getPrompts } from '../../api/client';
import { RAGPipeline } from './RAGPipeline';
import { getRandomWikipediaTitle } from '../../services/WikipediaService';

export class ArticlePipeline {
  public async generateArticle(title: string, context: string, model: string, onProgress?: (stage: string, data?: any) => void): Promise<{ title: string, content: string }> {
    if (!title || title.length === 0) {
      if (onProgress) onProgress('INIT', 'Generating random topic...');
      title = await getRandomWikipediaTitle();
    }

    let prompt = '';
    let systemPrompt = '';
    let backgroundInfo = '';

    const searchQuery = context.length > 0 ? `${title}\n${context}` : title;

    // Perform RAG to get background context
    try {
      const ragPipeline = new RAGPipeline();
      const chunks = await ragPipeline.retrieveContext(searchQuery, onProgress);
      if (chunks.length > 0) {
        // Use top 5 chunks to provide rich context without overflowing
        backgroundInfo = chunks.slice(0, 5).join('\n\n');
        if (onProgress) onProgress('PROCESSING_CONTEXT', chunks.slice(0, 5));
      }
    } catch (e) {
      console.warn('RAG retrieval failed', e);
    }

    try {
      const templates = await getPrompts();
      if (templates?.blog_generation?.user_template) {
        prompt = templates.blog_generation.user_template.replace('{topic}', searchQuery);
        if (templates.blog_generation.system) {
          systemPrompt = templates.blog_generation.system;
        }
        if (backgroundInfo) {
          prompt += `\n\nRelevant Research:\n${backgroundInfo}`;
        }
      } else {
        prompt = `Write a blog post about ${searchQuery}.`;
        if (backgroundInfo) {
          prompt += `\n\nUse the following research to write the article:\n${backgroundInfo}`;
        }
        prompt += `\n\nInclude a catchy title and clear headings.`;
      }
    } catch (e) {
      console.warn('Failed to fetch templates', e);
      prompt = `Write a blog post about ${searchQuery}.`;
      if (backgroundInfo) {
        prompt += `\n\nUse the following research to write the article:\n${backgroundInfo}`;
      }
      prompt += `\n\nInclude a catchy title and clear headings.`;
    }

    if (onProgress) onProgress('GENERATING', 'Generating article content...');
    const aiService = AIService.getInstance();
    const content = await aiService.generateAiText(prompt, model, 2000, systemPrompt);
    
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
}
