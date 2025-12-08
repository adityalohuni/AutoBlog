import { Request, Response, NextFunction } from 'express';
import { PromptService } from '../application/services/PromptService';

export class PromptController {
  private promptService: PromptService;

  constructor() {
    this.promptService = new PromptService();
  }

  public getPrompts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const templates = await this.promptService.getTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  };

  public getPromptByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category } = req.params;
      const template = await this.promptService.getTemplate(category);
      
      if (!template) {
        res.status(404);
        throw new Error('Prompt category not found');
      }
      
      res.json(template);
    } catch (error) {
      next(error);
    }
  };
}
