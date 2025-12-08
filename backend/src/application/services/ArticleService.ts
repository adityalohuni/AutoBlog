import { Database } from '../../infrastructure/database';
import { Article, CreateArticleDTO, UpdateArticleDTO } from '../../domain/Article';

export class ArticleService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async getAllArticles(): Promise<Article[]> {
    const result = await this.db.getPool().query('SELECT * FROM articles ORDER BY created_at DESC');
    return result.rows;
  }

  async getArticleById(id: string): Promise<Article | null> {
    const result = await this.db.getPool().query('SELECT * FROM articles WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async createArticle(data: CreateArticleDTO): Promise<Article> {
    const result = await this.db.getPool().query(
      'INSERT INTO articles (title, content) VALUES ($1, $2) RETURNING *',
      [data.title, data.content]
    );
    return result.rows[0];
  }

  async updateArticle(id: string, data: UpdateArticleDTO): Promise<Article | null> {
    const result = await this.db.getPool().query(
      'UPDATE articles SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [data.title, data.content, id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const result = await this.db.getPool().query('DELETE FROM articles WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }
}
