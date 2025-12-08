import { Router } from 'express';
import { ArticleController } from '../controllers/ArticleController';
import { validate } from '../middleware/validate';
import { articleSchema } from '../schemas/articleSchema';

const router = Router();
const articleController = new ArticleController();

router.get('/', articleController.getArticles);
router.get('/:id', articleController.getArticleById);
router.put('/:id', validate(articleSchema), articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);
router.post('/', validate(articleSchema), articleController.createArticle);

export default router;
