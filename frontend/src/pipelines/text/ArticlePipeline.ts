import { AIService } from '../../services/AIService';
import { getPrompts } from '../../api/client';
import { RAGPipeline } from './RAGPipeline';

export class ArticlePipeline {
  public async generateArticle(title: string, context: string, model: string): Promise<{ title: string, content: string }> {
    let prompt = '';
    let backgroundInfo = '';

    // Perform RAG to get background context
    try {
      console.log('Starting RAG retrieval for:', context);
      const ragPipeline = new RAGPipeline();
      const chunks = await ragPipeline.retrieveContext(context);
      if (chunks.length > 0) {
        // Use top 5 chunks to provide rich context without overflowing
        backgroundInfo = chunks.slice(0, 5).join('\n\n');
        console.log('RAG retrieved context length:', backgroundInfo.length);
      }
    } catch (e) {
      console.warn('RAG retrieval failed', e);
    }

    try {
      const templates = await getPrompts();
      if (templates?.blog_generation?.user_template) {
        prompt = templates.blog_generation.user_template.replace('{topic}', context);
        if (backgroundInfo) {
          prompt += `\n\nRelevant Research:\n${backgroundInfo}`;
        }
      } else {
        prompt = `Write a blog post about ${context}.`;
        if (backgroundInfo) {
          prompt += `\n\nUse the following research to write the article:\n${backgroundInfo}`;
        }
        prompt += `\n\nInclude a catchy title and clear headings.`;
      }
    } catch (e) {
      console.warn('Failed to fetch templates', e);
      prompt = `Write a blog post about ${context}.`;
      if (backgroundInfo) {
        prompt += `\n\nUse the following research to write the article:\n${backgroundInfo}`;
      }
      prompt += `\n\nInclude a catchy title and clear headings.`;
    }

    const aiService = AIService.getInstance();
    const content = await aiService.generateAiText(prompt, model, 2000);
    
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
