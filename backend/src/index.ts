import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Database } from './infrastructure/database';
import articlesRouter from './routes/articles';
import promptsRouter from './routes/prompts';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config/env';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors());

// Body parser
app.use(express.json());

// Routes
app.use('/articles', articlesRouter);
app.use('/prompts', promptsRouter);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error Handler
app.use(errorHandler);

// Initialize DB and start server
const startServer = async () => {
  const db = Database.getInstance();
  await db.init();
  
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

startServer();
