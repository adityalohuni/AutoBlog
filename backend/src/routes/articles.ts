import { Router } from 'express';
import { ArticleController } from '../controllers/ArticleController';
import { validate } from '../middleware/validate';
import { articleSchema } from '../schemas/articleSchema';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const articleController = new ArticleController();

router.get('/', articleController.getArticles);
router.get('/:id', articleController.getArticleById);
router.put('/:id', authMiddleware, validate(articleSchema), articleController.updateArticle);
router.delete('/:id', authMiddleware, articleController.deleteArticle);
router.post('/', authMiddleware, validate(articleSchema), articleController.createArticle);

export default router;
