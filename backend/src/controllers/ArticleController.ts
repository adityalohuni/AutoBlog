import { Request, Response, NextFunction } from 'express';
import { ArticleService } from '../application/services/ArticleService';

export class ArticleController {
  private articleService: ArticleService;

  constructor() {
    this.articleService = new ArticleService();
  }

  public getArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const articles = await this.articleService.getAllArticles();
      res.json(articles);
    } catch (error) {
      next(error);
    }
  };

  public getArticleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const article = await this.articleService.getArticleById(id);
      
      if (!article) {
        res.status(404);
        throw new Error('Article not found');
      }
      
      res.json(article);
    } catch (error) {
      next(error);
    }
  };

  public createArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, content } = req.body;
      const article = await this.articleService.createArticle({ title, content });
      res.status(201).json(article);
    } catch (error) {
      next(error);
    }
  };

  public updateArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const article = await this.articleService.updateArticle(id, { title, content });
      
      if (!article) {
        res.status(404);
        throw new Error('Article not found');
      }
      
      res.json(article);
    } catch (error) {
      next(error);
    }
  };

  public deleteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.articleService.deleteArticle(id);
      
      if (!success) {
        res.status(404);
        throw new Error('Article not found');
      }
      
      res.json({ message: 'Article deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
