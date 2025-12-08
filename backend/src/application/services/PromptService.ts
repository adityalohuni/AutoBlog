import fs from 'fs/promises';
import path from 'path';
import toml from '@iarna/toml';

export class PromptService {
  private templates: any = null;
  private readonly filePath = path.join(process.cwd(), 'src', 'prompts', 'templates.toml');

  async loadTemplates(): Promise<any> {
    if (this.templates) return this.templates;
    
    try {
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      this.templates = toml.parse(fileContent);
      return this.templates;
    } catch (error) {
      console.error('Error loading prompt templates:', error);
      throw new Error('Failed to load prompt templates');
    }
  }

  async getTemplates(): Promise<any> {
    return this.loadTemplates();
  }

  async getTemplate(category: string): Promise<any> {
    const templates = await this.loadTemplates();
    return templates[category];
  }
}
