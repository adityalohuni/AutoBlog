import { ArticlePipeline } from '../pipelines/text/ArticlePipeline';
import { createArticle, Article } from '../api/client';

export class ArticleService {
  private static instance: ArticleService;
  private articlePipeline: ArticlePipeline;

  private constructor() {
    this.articlePipeline = new ArticlePipeline();
  }

  public static getInstance(): ArticleService {
    if (!ArticleService.instance) {
      ArticleService.instance = new ArticleService();
    }
    return ArticleService.instance;
  }

  public async generateNewArticle(params: { title: string, context: string, model: string }): Promise<Article> {
    const articleData = await this.articlePipeline.generateArticle(params.title, params.context, params.model);
    return createArticle(articleData);
  }
}

export const articleService = ArticleService.getInstance();
