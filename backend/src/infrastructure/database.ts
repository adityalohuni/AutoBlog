import { Pool, PoolClient } from 'pg';
import { config } from '../config/env';

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      user: config.db.user,
      host: config.db.host,
      database: config.db.name,
      password: config.db.password,
      port: config.db.port,
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async connect(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async init(): Promise<void> {
    let retries = 5;
    while (retries) {
      try {
        const client = await this.pool.connect();
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS articles (
              id SERIAL PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `);

          console.log('Database initialized successfully');
          client.release();
          return;
        } catch (err) {
          client.release();
          throw err;
        }
      } catch (err) {
        console.error('Database connection failed, retrying...', err);
        retries -= 1;
        await new Promise((res) => setTimeout(res, 5000));
      }
    }
    throw new Error('Could not connect to database after multiple retries');
  }
}
